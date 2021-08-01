# Interactive digital frame with head-tracking using Three.js & TensorFlow.js

Using [TensorFlow.js](https://www.tensorflow.org/js) and [Three.js](https://threejs.org/), this project is a prototype of an interactive digital art frame using head-tracking to create an effect of head-coupled perspective.

A famous use of this effect can be seen in [Ghost Protocol](https://www.youtube.com/watch?v=ydIPKkjBlMw&t=30s).

I wanted to experiment with making interactive art pieces so this project is a PWA that can be run fullscreen on an iPad.

:warning: This is a prototype made as a side project so the code is not production-ready. Its performance is not optimised so the first load can take a while. I developed and tested it on a Macbook Pro and iPad Pro so if you try it on another device and it doesn't work or doesn't look super responsive, I don't intend to fix it. With that in mind, here's the [live demo](https://interactive-frame.netlify.app) that works with both mouse movements and head-tracking. :warning:

## Demo

![](head-coupled-perspective.gif)

If you'd like to read more about it, check out the [blog post](https://charliegerard.dev/blog/interactive-frame-head-tracking)!

## Local development

- Clone this repo
- Run `npm install` to install the dependencies
- Run `npm start` to start the local server
- Your browser should automatically open a new tab to `http://localhost:3000`
