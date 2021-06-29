<template>
  <v-carousel

    :style="`background: ${$vuetify.theme.themes.light.primary}`"
  >
    <v-hover>
      <template v-slot:default="{ hover  }">

        <div>
          <v-carousel-item
            v-for="(item, i) in items"

            :src="item.src && item.src"
          >
            <iframe
              v-if="item.iframe"
              :src="iframeSrc(item.iframe)"
              width="100%"
              height="100%"
              allowfullscreen
              frameborder="0"

            ></iframe>




          </v-carousel-item>
        </div>
      </template>
    </v-hover>
  </v-carousel>
</template>

<script>
export default {
  data() {
    return {
      items: this.$store.state.config.appConfig.covidIndiaItems,
    };
  },
  methods: {
    onClickItem(items) {
      const { poi } = items;
      if (poi) {
        const aoiId = poi.split('-')[0];
        const indicatorCode = poi.split('-')[1];
        const selectedFeature = this.$store.state.features.allFeatures.find((f) => {
          const { indicatorObject } = f.properties;
          return indicatorObject.aoiID === aoiId
            && indicatorObject.indicator === indicatorCode;
        });
        this.$store.commit('indicators/SET_SELECTED_INDICATOR', selectedFeature.properties.indicatorObject);
      }
    },

    iframeSrc(src) {
      let newSrc;
      if (this.autoPlayIframe) {
        newSrc = `${src}?autoplay=1`;
      } else {
        newSrc = src;
      }
      return newSrc;
    },
  },
  watch: {
    currentSlide() {
      if (this.autoPlayIframe) {
        this.autoPlayIframe = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
::v-deep .v-responsive__content {
  display: flex;
  align-items: center;
  justify-content: center;
}
.playButton {
  position: absolute;
  z-index: 999;
}
</style>
