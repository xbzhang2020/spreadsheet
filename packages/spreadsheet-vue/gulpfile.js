import dartSass from "sass";
import gulpSass from "gulp-sass";
import gulp from "gulp";
import { spawn } from "child_process";

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

const sass = gulpSass(dartSass);
const { src, dest, series } = gulp;

export async function buildComponents() {
  return run("vite build", ".");
}

export async function buildStyles() {
  return src("./theme-chalk/**/*.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(dest("./es/theme-chalk"))
    .pipe(dest("./lib/theme-chalk"));
}

export default series(buildComponents, buildStyles);
