<template>
  <div
    class="pa-7 pb-0"
    :class="$vuetify.breakpoint.xsOnly && 'pb-10'"
  >
    <v-row class="d-flex">
      <v-col
        cols="12"
      >
        <h1 class="display-6 primary--text">IMPACT OF COVID 19 IN INDIA'S AQI </h1>
      </v-col>
      <v-col
        cols="12"
      >
        <v-card outlined>
          <covid-india  v-if="appConfig.showCovidIndia" />
        </v-card>
      </v-col>
      <template v-if="baseConfig.indicatorClassesIcons">
      </template>
      <v-col
        cols="12"
      >
      <v-expansion-panels
        v-if="tutorials"
        flat
        :multiple="false"
        v-model="panel"
      >

        <v-expansion-panel
          v-if="tutorials"
          key="tutorials"
          class="panel-outlined"
        >

        </v-expansion-panel>
      </v-expansion-panels>
      <v-card v-else outlined class="pa-5">
        <div
          v-html="welcome"
          class="md-body"
        ></div>
      </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import {
  mapGetters,
  mapState,
} from 'vuex';

import CovidIndia from '@/components/CovidIndia.vue';

export default {
  components: {
    CovidIndia,
  },
  data: () => ({
    panel: 0,
  }),
  computed: {
    ...mapGetters('features', [
      'getCountries',
      'getIndicators',
      'getLatestUpdate',
    ]),
    ...mapState('config', [
      'appConfig',
      'baseConfig',
    ]),
    ...mapState('features', [
      'allFeatures',
    ]),
    welcome() {
      return this.$marked(require(`../../public${this.appConfig.welcomeText}.md`).default);
    },
    tutorials() {
      return this.appConfig.tutorialText
        && this.$marked(require(`../../public${this.appConfig.tutorialText}.md`).default);
    },
  },
};
</script>

<style lang="scss" scoped>
.panel-outlined {
  border: 1px solid var(--v-primary-base);
  border-radius: 4px;
}
.v-expansion-panel:not(:first-child) {
  margin-top: 16px;
}
</style>
