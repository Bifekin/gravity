# 模拟天体运动
Planetary orbit simulation written in p5 js.

更新日志：
2024.2.10
1. 增加了一些模型
2. 加载模型改成从文件列表读取
3. 可以决定是否会破碎行星
4. 模型可以从 http://three-body.ipb.ac.rs/ 找，再通过data.py进行坐标变换这个坐标系


### 项目简介
1. 天体包括Sun类和Planet类，前者不考虑速度，静止，后者为运动行星
2. 模拟混乱行星系统前先删除预设的Sun

### 有两种模式:恒星系统 和 混乱系统
其实区别就是是否是否删除恒星Sun, 因为这里的恒星对象是不考虑运动的
1. 恒星系统
   
   具有一颗绝对静止的恒星
2. 混乱系统
   
    里面的行星都是运动的


###  p5.js项目执行流程为：
1. html页面加载时，先加载 p5.js 库。
2. p5.js 加载完成后，加载并执行 main.js 文件。
3. 执行 setup 函数进行初始设置，然后进入循环执行 draw 函数（在p5.js里定义了），不断更新画面。
   

### web页面指令
#### 创建行星
1. 'o'键: 创建围绕太阳Sun圆周运动行星，再次按'o'改变方向, 只在太阳存在的时候才能这样创建标准轨道，可以改变离心率
2. 勾选shooting，鼠标左键，创建行星(最低速度为5单位)
#### 删除行星
    选中后删除
#### 重置行星速度和行星
    resetAll:重置所有行星

    updateAll:更新所有行星当前位置为初始状态，以便重置
#### 保存和加载模型
    save：保存当前模型的参数  
    注意: 行星数据保存的是初始速度，初始位置，保存模型前先updataAll(更新当前位置为初始速度，初始位置)。
    load:加载模型, ./model文件夹下已经有了一些预设的模型 
#### 暂停
    空格键
#### crash 勾选框
    决定碰撞行星是否会碎裂

### 注意，右键出现的菜单中前三项是全局的，后四项是针对单个行星的，只有选中行星才有效果



### 实验环境
vs code + 插件live server

alt + l, alt + o本地部署运行

### 文件结构：

```
gravity
├─ background.png------------------------背景图片
├─ css-----------------------------------界面美化
│  ├─ bootstrap.min.css
│  └─ styles.css
├─ data.py-------------------------------将网址里的三体周期解变换到这个坐标系
├─ index.html----------------------------核心HTML文件
├─ libs----------------------------------包括p5.js和美化库
│  ├─ bootstrap.min.js
│  ├─ jquery-1.12.4.min.js
│  └─ p5.js
├─ LICENSE
├─ model---------------------------------预保存的模型
│  ├─ double_double.json
│  ├─ fourStar.json
│  ├─ interesting_1.json
│  ├─ sun_earth_moon.json
│  ├─ test.json
│  ├─ threeBody_8.json
│  ├─ threeBody_8_2.json
│  ├─ threeBody_chaos.json
│  ├─ threeBody_circles.json
│  ├─ threeBody_crossed_triple_loop.json
│  ├─ threeBody_flowers.json
│  ├─ threeBody_incircle.json
│  ├─ threeBody_pailie.json
│  ├─ threeBody_threecircles.json
│  ├─ threeBody_threeovals.json
│  ├─ threeBody_twoOvals.json
│  ├─ twoCircles.json
│  └─ twoStar.json
├─ ParticleSystem.js---------------------粒子系统类，碰撞特效
├─ Planet.js-----------------------------行星类
├─ README.md
├─ shader--------------------------------渲染器，给行星，太阳渲染光晕
│  ├─ fragmentShader.frag
│  └─ vertexShader.vert
├─ Shooter.js----------------------------发射器类，用于创建行星
├─ main.js-------------------------------核心逻辑函数
└─ Sun.js--------------------------------太阳类，静止

```