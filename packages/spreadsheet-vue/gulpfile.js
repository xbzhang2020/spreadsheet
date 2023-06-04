import dartSass from "sass";
import gulpSass from "gulp-sass";
import gulp from "gulp";
import { spawn } from "child_process";

const sass = gulpSass(dartSass);
const { src, dest, series } = gulp;

const rootPath = ".";
const stylePath = "theme-chalk";

export async function run(command, path) {
  const [cmd, ...args] = command.split(" ");
  return new Promise((resolve, reject) => {
    const app = spawn(cmd, args, {
      cwd: path, //执行命令的路径
      stdio: "inherit", //输出共享给父进程
      shell: true, //mac不需要开启，windows下git base需要开启支持
    });

    app.on("close", resolve);
    app.on("error", reject);
  });
}

export async function buildComponents() {
  return run("vite build", rootPath);
}

export async function buildStyles() {
  return src(`${rootPath}/${stylePath}/**/*.scss`)
    .pipe(sass().on("error", sass.logError))
    .pipe(dest(`${rootPath}/es/${stylePath}`))
    .pipe(dest(`${rootPath}/lib/${stylePath}`));
}

export default series(buildComponents, buildStyles);
