<script setup>
import { onMounted, ref, reactive } from 'vue';
import { parseGIF, decompressFrames } from 'gifuct-js';
import Sortable from 'sortablejs';

let gif_url = ref('');
let url_input = ref('https://img.soogif.com/MEjPTY0DMzVvOnG4FDt0DVb7yGFsBJG3.gif');
let gif = reactive({});
let frames = reactive([]);
let progress = ref(0);
let curFrameIdx = ref(0);
let showFrameThumbnail = ref(false);
let framesBase64List = reactive([]);
const progressBar = ref(null);
const framePlayer = ref(null);
const frameThumbnail = ref(null);
const dragWrapper = ref(null);

const canvasCache = reactive({
  cache: {},
  getCanvas(id) {
    if (!this.cache[id]) {
      this.cache[id] = document.createElement('canvas');
    }
    return this.cache[id];
  }
})

function frameLoop(frame) {
  const t = setTimeout(() => {
    curFrameIdx.value++;
    if (curFrameIdx.value >= frames.length) {
      curFrameIdx.value = 0;
    }
    clearTimeout(t);
    const playerCtx = framePlayer.value.getContext('2d');
    const img = new Image();
    img.onload = () => {
      playerCtx.drawImage(img, 0, 0, 400, 250)
    }
    img.src = frame;
    updateProgressBar(curFrameIdx.value / frames.length);
    frameLoop(framesBase64List[curFrameIdx.value].data);
  }, frame.delay || 100);
}

function updateProgressBar(value) {
  const ctx = progressBar.value.getContext('2d');
  progress.value = value;
  if (progress.value > 1) {
    progress.value = 1;
  }

  ctx.clearRect(0, 0, progressBar.value.width, progressBar.value.height);
  ctx.fillStyle = '#ddd';
  ctx.fillRect(0, 0, progressBar.value.width, progressBar.value.height);
  ctx.fillStyle = '#007bff';
  ctx.fillRect(0, 0, progressBar.value.width * progress.value, progressBar.value.height);
}

function drawParsedImgBase64(frame) {
  const dims = frame.dims;
  const parsedImgCanvas = canvasCache.getCanvas(`${frame.width} * ${frame.height}`);
  const parsedImgCtx = parsedImgCanvas.getContext('2d');
  parsedImgCanvas.width = dims.width;
  parsedImgCanvas.height = dims.height;

  const frameImgData = parsedImgCtx.createImageData(dims.width, dims.height);
  frameImgData.data.set(frame.patch);
  parsedImgCtx.putImageData(frameImgData, 0, 0);

  return parsedImgCanvas.toDataURL();
}

function handleUrlInput(e) {
  url_input.value = e.target.value;
}

async function handleBtnClick() {
  gif_url.value = url_input.value;
  await fetch(gif_url.value)
    .then(res => res.arrayBuffer())
    .then(buffer => {
      gif = parseGIF(buffer);
      frames = decompressFrames(gif, true);

      frames.forEach((frame, idx) => {
        const imgBase64 = drawParsedImgBase64(frame);
        framesBase64List.push({ data: imgBase64, id: 'origin' + idx });
      });
    });
  frameLoop(framesBase64List[curFrameIdx.value].data);
}


const handleMouseEnter = () => {
  showFrameThumbnail.value = true;
}

const handleMouseMove = (event) => {
  if (!showFrameThumbnail.value) {
    return;
  }
  // 获取鼠标在 canvas 中的坐标
  const x = event.offsetX;
  const hoverPersent = x / 400;
  const hoverFrameIdx = Math.round(hoverPersent * (frames.length - 1));

  let leftOffset = x - 80;
  if (leftOffset < 0) {
    leftOffset = 0;
  } else if (leftOffset > event.target.width - 160) {
    leftOffset = event.target.width - 160;
  }
  frameThumbnail.value.style.marginLeft = leftOffset + 'px';
  frameThumbnail.value.style.top = -100 + 'px';
  frameThumbnail.value.style.position = 'absolute';
  const img = new Image();
  img.onload = () => {
    frameThumbnail.value.getContext('2d').drawImage(img, 0, 0, 160, 100);
  }
  img.src = framesBase64List[hoverFrameIdx].data;
};

const handleMouseLeave = () => {
  showFrameThumbnail.value = false;
}

function onDragUpdate(evt) {
  const { oldIndex, newIndex, from, item } = evt;
  item.parentElement.removeChild(item);
  from.insertBefore(item, oldIndex === 0 ? from.children[0] : from.children[oldIndex - 1].nextSibling);
  framesBase64List.splice(newIndex, 0, framesBase64List.splice(oldIndex, 1)[0]);
}

onMounted(() => {
  Sortable.create(dragWrapper.value, {
    onUpdate: onDragUpdate
  });
})

</script>

<template>
  <header>
    <input class="url-input" @input="handleUrlInput" :value="url_input" />
    <button @click="handleBtnClick">传入图片</button>
    <div class="player-wrapper">
      <canvas ref="framePlayer" width="400" height="250"></canvas>
      <span >{{ `${curFrameIdx}/${framesBase64List.length}` }}</span>
    </div>
    <div class="control-area">
      <canvas ref="frameThumbnail" width="160" height="100" v-show="showFrameThumbnail"></canvas>
      <canvas ref="progressBar" width="400" height="20" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave"
        @mouseenter="handleMouseEnter"></canvas>
    </div>
    <img class="logo" :src="gif_url" width="400" height="250" />
  </header>

    <div ref="dragWrapper" class="parsed-img-wrapper">
      <TransitionGroup name="parsed-img">
        <div v-for="(item, index) in framesBase64List" :key="item.id">
          <span>{{ index }}</span>
          <img class="parsed-img-item" :src="item.data" >
        </div>
      </TransitionGroup>
    </div>
</template>

<style>
header {
  line-height: 1.5;
}

.url-input {
  width: 300px;
}

.parsed-img-wrapper {
  width: 900px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 10px;
}

.parsed-img-move {
  transition: transform .5s;
}

.parsed-img-wrapper img {
  width: 217.5px;
}

.parsed-img-item {
  cursor: move;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    flex-direction: column;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
