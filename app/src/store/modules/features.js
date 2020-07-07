/* eslint no-shadow: ["error", { "allow": ["state"] }] */
import { Wkt } from 'wicket';
import { latLng } from 'leaflet';
import { DateTime } from 'luxon';
import countriesJson from '@/assets/countries.json';

let globalIdCounter = 0;
const state = {
  allFeatures: [],
  featureFilters: {
    countries: [],
    indicators: [],
  },
  selectedFeatures: [],
  resultsCount: {
    economic: 0,
    agriculture: 0,
    environment: 0,
    health: 0,
  },
};

const getters = {
  getCountries(state) {
    return [...new Set([
      state.allFeatures
        .map((f) => f.properties.indicatorObject.country),
    ].flat(1))].sort();
  },
  getIndicators(state, _, rootState) {
    const indicators = [...new Set([
      state.allFeatures
        .map((f) => ({
          code: f.properties.indicatorObject.indicator,
          indicator: f.properties.indicatorObject.Description,
          class: rootState.config.baseConfig.indicatorsDefinition[f.properties.indicatorObject.indicator].class,
        })),
    ].flat(2))].sort();
    return indicators;
  },
  getCountryItems(state, gettersG) {
    return gettersG.getCountries
      .filter((c) => c !== 'all')
      .map((c) => {
        const item = countriesJson.features
          .find((f) => f.properties.alpha2 === c);
        return {
          code: c,
          name: item ? item.properties.name : 'Regional',
        };
      })
      .sort((a, b) => ((a.name > b.name) ? 1 : -1));
  },
  getFeatures(state) {
    let features = state.allFeatures;
    if (state.featureFilters.countries.length > 0) {
      features = features
        .filter((f) => {
          if (Array.isArray(f.properties.indicatorObject.country)) {
            return f.properties.indicatorObject.country
              .includes(state.featureFilters.countries);
          } else { // eslint-disable-line
            return state.featureFilters.countries
              .includes(f.properties.indicatorObject.country)
              || f.properties.indicatorObject.city === 'World';
          }
        });
    }
    if (state.featureFilters.indicators.length > 0) {
      features = features
        .filter((f) => state.featureFilters.indicators
          .includes(f.properties.indicatorObject.indicator));
    }
    features = features
      .sort((a, b) => ((a.properties.indicatorObject.country > b.properties.indicatorObject.country)
        ? 1 : -1));
    return features;
  },
  getLatestUpdate(state) {
    const times = state.allFeatures.map((f) => {
      let time = f.properties.indicatorObject.Time;
      let latest;
      if (time && time.length > 0) {
        time = time.sort((a, b) => ((a > b) ? 1 : -1));
        latest = time[time.length - 1];
      }
      return latest;
    });
    const filtered = times.filter((t) => !!t).sort((a, b) => ((a > b) ? 1 : -1));
    return filtered[filtered.length - 1];
  },
};

const mutations = {
  // SET_MANUAL_FEATURES(state, features) {
  //   state.allFeatures = state.allFeatures.concat(
  //     features,
  //     this.state.config.baseConfig.globalIndicators,
  //   );
  // },
  ADD_NEW_FEATURES(state, features) {
    state.allFeatures = state.allFeatures.concat(features);
  },
  // SET_ALL_DUMMY_LOCATIONS(state, features) {
  //   state.allFeatures = state.allFeatures.concat(features);
  // },
  INIT_FEATURE_FILTER(state, { countries, indicators }) {
    if (countries) {
      state.featureFilters.countries = countries;
    }
    if (indicators) {
      state.featureFilters.indicators = indicators;
    }
  },
  SET_FEATURE_FILTER(state, { countries, indicators }) {
    if (countries) {
      state.featureFilters.countries = countries;
    }
    if (indicators) {
      state.featureFilters.indicators = indicators;
    }
  },
  SET_SELECTED_FEATURES(state, features) {
    state.selectedFeatures = features;
  },
  ADD_RESULTS_COUNT(state, { type, count }) {
    state.resultsCount[type] += count;
  },
};
const actions = {
  async loadAllEndpoints({ commit, rootState }) {
    let allFeatures = [];
    const endpoints = rootState.config.baseConfig.dataEndpoints;
    for (let ep = 0; ep < endpoints.length; ep += 1) {
      if (Object.prototype.hasOwnProperty.call(endpoints[ep], 'type')
        && endpoints[ep].type === 'geodb') {
        let url = endpoints[ep].provider;
        if (Object.prototype.hasOwnProperty.call(endpoints[ep], 'locationSuffix')) {
          url += endpoints[ep].locationSuffix;
        }
        const { token } = endpoints[ep];
        const F = await this.dispatch( // eslint-disable-line
          'features/loadGeoDBEndpoint', { url, token },
        );
        allFeatures = allFeatures.concat(F);
      }
    }
    /*
    // Then, add the hardcoded features
    allFeatures = allFeatures.concat(rootState.config.baseConfig.globalIndicators);
    // Then, if applicable, add the dummy features
    if (rootState.config.appConfig.displayDummyLocations) {
      const dummyFeatures = await this.dispatch('features/loadDummyLocations');
      allFeatures = allFeatures.concat(dummyFeatures);
    }
    */
    commit('ADD_NEW_FEATURES', allFeatures);
  },
  loadGeoDBEndpoint({ rootState, commit }, { url, token }) {
    return fetch(url, {
      method: 'get',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
    }).then((r) => r.json())
      .then((data) => {
        const features = [];
        const pM = {
          aoi: 'aoi',
          colorCode: 'Color code',
          city: 'city',
          country: 'country',
          description: 'description',
          eoSensor: 'eo sensor',
          id: 'id',
          indicator: 'indicator',
          indicatorValue: 'indicator value',
          inputData: 'input data',
          lastMeasurement: 'measurement value [float]',
          lastTime: 'date time [yyyy-mm-ddthh:mm:ss]',
          method: 'method',
          lastReferenceTime: 'reference date time [yyyy-mm-ddthh:mm:ss]',
          lastReferenceValue: 'reference value [float]',
          referenceDescription: 'reference description',
          region: 'region (optional)',
          geometry: 'geometry',
          created: 'created_at',
          modified: 'modified_at',
          rule: 'rule',
          siteName: 'site name',
          subAoi: 'sub-aoi',
          updateFrequency: 'update frequency', // Not present
        };
        commit('ADD_RESULTS_COUNT', {
          type: rootState.config.baseConfig.indicatorsDefinition[data[0][pM.indicator]].class,
          count: data.length, // individual measurements
        });
        if (data[0].aoi) { // only continue if aoi column is present
          const wkt = new Wkt();
          const featureObjs = {};
          for (let rr = 0; rr < data.length; rr += 1) {
            // Aggregate data based on location
            const uniqueKey = `${data[rr][pM.aoi]}_${data[rr][pM.indicator]}`;
            if (!Object.prototype.hasOwnProperty.call(featureObjs, uniqueKey)) {
              featureObjs[uniqueKey] = {};
            }
            // Create new object with mapped keys to allow integrating data
            // of multiple endpoints
            Object.entries(pM).forEach(([key, value]) => {
              if (Object.prototype.hasOwnProperty.call(data[rr], value)) {
                if (key === 'subAoi') {
                  // dummy empty geometry
                  let ftrs = [];
                  try {
                    // assuming sub-aoi does not change over time
                    if (data[rr][value] !== '') {
                      wkt.read(data[rr][value]);
                      const jsonGeom = wkt.toJson();
                      // create a feature collection
                      ftrs = [{
                        type: 'Feature',
                        properties: {},
                        geometry: jsonGeom,
                      }];
                    }
                  } catch (err) {} // eslint-disable-line no-empty
                  const ftrCol = {
                    type: 'FeatureCollection',
                    features: ftrs,
                  };
                  featureObjs[uniqueKey][key] = ftrCol;
                } else if (key === 'lastMeasurement') {
                  featureObjs[uniqueKey][key] = data[rr][value].length !== 0
                    ? Number(data[rr][value]) : NaN;
                } else {
                  featureObjs[uniqueKey][key] = data[rr][value];
                }
              }
            });
          }
          const keys = Object.keys(featureObjs);

          for (let kk = 0; kk < keys.length; kk += 1) {
            const coordinates = keys[kk].split('_')[0].split(',').map(Number);
            // console.log(featureObjs[keys[kk]]);
            featureObjs[keys[kk]].AOI = latLng(coordinates);
            featureObjs[keys[kk]].id = globalIdCounter; // to connect indicator & feature
            features.push({
              latlng: latLng(coordinates),
              id: globalIdCounter,
              properties: {
                indicatorObject: featureObjs[keys[kk]],
              },
            });
            globalIdCounter += 1;
          }
        }
        return features;
      });
  },
  loadDummyLocations({ rootState }) {
    return new Promise((resolve) => {
      this._vm.$papa.parse(rootState.config.appConfig.displayDummyLocations, {
        download: true,
        quotes: true,
        header: true,
        skipEmptyLines: true,
        delimiter: ',',
        complete: (results) => {
          if (data[0].AOI) { // only continue if AOI column is present
            const featureObjs = {};
            for (let rr = 0; rr < data.length; rr += 1) {
              const uniqueKey = `${data[rr].AOI}_d`;
              featureObjs[uniqueKey] = data[rr];
              featureObjs[uniqueKey].indicator = 'd';
              featureObjs[uniqueKey].indicatorValue = [''];
            }
            const features = [];
            const keys = Object.keys(featureObjs);

            for (let kk = 0; kk < keys.length; kk += 1) {
              const coordinates = keys[kk].split('_')[0].split(',').map(Number);
              featureObjs[keys[kk]].id = globalIdCounter; // to connect indicator & feature
              features.push({
                latlng: latLng(coordinates),
                id: globalIdCounter,
                properties: {
                  indicatorObject: featureObjs[keys[kk]],
                },
              });
              globalIdCounter += 1;
            }
            resolve(features);
          }
        },
      });
    });
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
