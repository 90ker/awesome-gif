<script setup>
import { onMounted, reactive } from 'vue';
import { parseGIF, decompressFrames } from 'gifuct-js';

let gif_url = 'https://img.soogif.com/MEjPTY0DMzVvOnG4FDt0DVb7yGFsBJG3.gif';
let gif = reactive({});
let frames = reactive([]);
onMounted(() => {
  fetch(gif_url)
    .then(res => res.arrayBuffer())
    .then(buffer => {
      gif = parseGIF(buffer);
      frames = decompressFrames(gif, true);
      console.log('gif', gif);
      console.log('frames', frames);
      const parsedImgWrapper = document.getElementById('piw');
      for (let frame of frames) {
        drawParsedImg(frame, parsedImgWrapper);
      }
    });
});

function drawParsedImg(frame, parsedImgWrapper) {
  const dims = frame.dims;
  const parsedImgCanvas = document.createElement('canvas');
  parsedImgCanvas.style.marginLeft = '10px';
  const parsedImgCtx = parsedImgCanvas.getContext('2d');
  parsedImgCanvas.width = dims.width;
  parsedImgCanvas.height = dims.height;

  const frameImgData = parsedImgCtx.createImageData(dims.width, dims.height);
  frameImgData.data.set(frame.patch);
  parsedImgCtx.putImageData(frameImgData, 0, 0);

  parsedImgWrapper.appendChild(parsedImgCanvas);
}

</script>

<template>
  <header>
    <img class="logo" src="https://img.soogif.com/MEjPTY0DMzVvOnG4FDt0DVb7yGFsBJG3.gif" width="400" height="250" />
  </header>

  <main>
    <div id="piw" class="parsed-img-wrapper">
    </div>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}


.parsed-img-wrapper {
  display: flex;
  width: 900px;
  flex-wrap: nowrap;
  overflow-x: scroll;
}


@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
