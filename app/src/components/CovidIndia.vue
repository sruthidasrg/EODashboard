<template>
  <v-carousel
    height="auto"
    :show-arrows = false
  >
      <template >
        <div>
          <v-carousel-item
            v-for="(item, i) in items"
            :item=items
            :key="i"
            :aspect-ratio="20/19"
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
     </v-carousel>
</template>

<script>
export default {
  data() {
    return {
      currentSlide: 0,

      items: this.$store.state.config.appConfig.covidIndiaItems,
    };
  },
  methods: {
    iframeSrc(src) {
      return src;
    },
  },

};
</script>
