# awesome-gif
# 目的
> 打怪加经验
- vue3 **+1exp**
  - 动画 **+1exp**
- canvas **+1exp**
- 开发流程 **+1exp**
# 功能点梳理（致敬 www.soogif.com）
- gif 解析成多图
  - 引入gifuct-js 解析gif
  - 根据解析结果，绘制出每张图片
- 图片转gif
  - 重新生成gif图，并增加进度条
  - 进度条新增功能，hover展示对应帧的缩略图
  - 引入vue-draggable-next，实现图片拖拽排序
  - 实现拖拽图片后，重新生成对应gif图
  - 增加拖拽图片的动画
    - 经过两天的连猜带蒙，发现由于vue-draggable-next年久失修，已经不支持vue@3.2.74版本了
    - 具体bug表现为：Transition动画组件内的Slot渲染出来后，vNode上没有el，导致draggable报错
    - 基于此决定直接使用SortableJS
    - vue3 的TranstionGroup的move动画，是由数据变化触发的，而不是dom触发，所以要先改变数据
    - 而且必须重新把dom插入一遍才会生效动画
    - move动画是根据key来排序的,使用base64作为key的时候，出现了排序错乱的问题，随即提前用idx生成id作为key
  - 给gif播放过程和图片增加索引
  - 明确划分两片区域，避免流程混乱
  - 增加插入图片的区域
    - 使用grid布局