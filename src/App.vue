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
    <div class="materials">
      <div class="title">
        <h1>素材</h1>
      </div>
      <div class="content">
        <img :src="gif_url" width="400" height="250" />
        <div class="operator">
          <input class="url-input" @input="handleUrlInput" :value="url_input" />
          <button @click="handleBtnClick">传入图片</button>
        </div>
      </div>
      <div class="arrow">
        <svg t="1682320923579" class="arrow-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
          p-id="7388" width="40" height="40">
          <path
          fill
            d="M557.397333 167.204571l293.059048 293.059048L902.192762 512l-51.712 51.712-293.059048 293.083429-51.736381-51.712L762.148571 548.571429H121.904762v-73.142858h640.243809L505.660952 218.940952l51.736381-51.736381z"
            p-id="7389"></path>
        </svg>
      </div>
    </div>
    <div class="materials">
      <div class="title">
        <h1>成品</h1>
      </div>
      <div class="content">
        <div class="player-wrapper">
          <canvas ref="framePlayer" width="400" height="250"></canvas>
          <div>{{ `${curFrameIdx}/${framesBase64List.length}` }}</div>
          <div class="control-area">
            <canvas ref="frameThumbnail" width="160" height="100" v-show="showFrameThumbnail"></canvas>
            <canvas ref="progressBar" width="400" height="20" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave"
              @mouseenter="handleMouseEnter"></canvas>
          </div>
        </div>
      </div>
      <div class="arrow">
        <svg t="1682320923579" class="arrow-icon-reverse" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
          p-id="7388" width="40" height="40">
          <path
            d="M557.397333 167.204571l293.059048 293.059048L902.192762 512l-51.712 51.712-293.059048 293.083429-51.736381-51.712L762.148571 548.571429H121.904762v-73.142858h640.243809L505.660952 218.940952l51.736381-51.736381z"
            p-id="7389"></path>
        </svg>
      </div>
    </div>


  </header>

  <div ref="dragWrapper" class="parsed-img-wrapper">
    <TransitionGroup name="parsed-img">
      <div v-for="(item, index) in framesBase64List" :key="item.id">
        <span>{{ index }}</span>
        <img class="parsed-img-item" :src="item.data">
      </div>
    </TransitionGroup>
  </div>
</template>

<style>
.materials {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
}


header {
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  fill: #fff;
}

.url-input {
  width: 300px;
}

.parsed-img-wrapper {
  width: 930px;
  height: 100vh;
  overflow-y: scroll;
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

.arrow-icon-reverse {
  transform: rotate(180deg);
}

</style>
