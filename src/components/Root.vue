<template>
  <!-- 1. 整体容器: 增加上下内边距，使用更浅的背景色 -->
  <div class="text-center px-4 py-8 md:px-6 md:py-12 bg-gray-50 min-h-screen">
    <!-- 2. 最大内容宽度容器 -->
    <div class="max-w-3xl mx-auto">  <!-- 调整了最大宽度，可以根据喜好改为 4xl 或 1024px -->

      <!-- 3. 标题和描述: 调整间距和描述文字大小/颜色 -->
      <h1 class="font-bold text-3xl md:text-4xl text-gray-800">Stable Diffusion 法术解析</h1>
      <p class="text-gray-500 my-3 text-base">
        从 Stable Diffusion 生成的图片或模型文件读取元数据
      </p>

      <!-- 4. 图片预览区域: 使用卡片包裹，增加圆角和内边距 -->
      <el-card v-if="imgFileRef && imageRef" class="my-8 shadow-sm rounded-lg" body-style="padding: 1rem;">
        <img v-bind="imageRef" alt="图片预览" class="block mx-auto rounded" style="max-height: 40vh; width: auto; height: auto; max-width: 100%;" />
      </el-card>

      <!-- 5. 文件上传区域: 增加上下外边距 -->
      <div class="my-8">
        <el-upload class="upload-demo" drag multiple :before-upload="handleUpload" accept="image/png, image/jpeg, image/webp, image/avif, .pt, .pth, .ckpt, .safetensors, .bin">
          <el-icon class="el-icon--upload text-4xl text-gray-400"><upload-filled /></el-icon>
          <div class="el-upload__text text-base">拖动图片/模型到这里，或<em>点击选择</em></div>
          <template #tip>
            <div class="el-upload__tip text-gray-500 text-sm mt-2">
              支持 PNG, JPEG, WEBP, AVIF 图片 和 PT, PTH, CKPT, SAFETENSORS, BIN 模型文件
            </div>
          </template>
        </el-upload>
      </div>

      <!-- 6. 信息展示区域: 使用 el-card 包裹，内部列表样式简化 -->
      <!-- 图片信息卡片 -->
      <el-card v-if="imgFileRef && imgfileInfoRef" class="my-8 shadow-sm rounded-lg text-left" body-style="padding: 0;">
        <template #header>
          <h2 class="font-semibold text-xl text-gray-700">图片信息</h2>
        </template>
        <!-- 使用 div 代替复杂边框，仅保留底部分隔线 (可选) -->
        <div v-for="(item, index) in imgfileInfoRef" :key="item.key" class="px-5 py-3 border-b border-gray-100 last:border-b-0">
          <h3 class="font-medium text-sm text-gray-800 flex items-center">
            <span>{{ item.key }}</span>
            <!-- 复制按钮调整 -->
            <el-popover placement="top-start" trigger="hover" content="点击复制" :width="60" v-if="showCopyBtn(item.key)">
              <template #reference>
                <el-button class="ml-2 p-0" style="min-height: auto; height: auto;" :icon="CopyDocument" text circle @click="item.key == 'Comment' ? copy(jsonData.uc) : copy(item.value)" />
              </template>
            </el-popover>
          </h3>
          <!-- 调整值显示样式，增加行高 -->
          <p class="text-wrap break-all text-sm mt-1 text-gray-600 leading-relaxed" style="white-space: pre-wrap" v-if="!showJsonViewer(item.key)">
            {{ item.value }}
          </p>
          <!-- JSON 查看器保持不变 -->
          <json-viewer class="mt-1" :value="jsonData" v-if="jsonData != null && showJsonViewer(item.key)" :expand-depth=4>
          </json-viewer>
        </div>
      </el-card>

      <!-- EXIF 信息卡片 -->
      <el-card v-if="imgFileRef && exifRef && exifRef.length > 0" class="my-8 shadow-sm rounded-lg text-left" body-style="padding: 0;">
         <template #header>
          <h2 class="font-semibold text-xl text-gray-700">EXIF 元数据</h2>
        </template>
         <div v-for="(item, index) in exifRef" :key="item.key" class="px-5 py-3 border-b border-gray-100 last:border-b-0">
           <h3 class="font-medium text-sm text-gray-800">{{ item.key }}</h3>
           <p class="text-wrap break-all text-sm mt-1 text-gray-600 leading-relaxed" style="white-space: pre-wrap">
            {{ item.value.description }}
           </p>
         </div>
      </el-card>

       <!-- 模型信息卡片 -->
       <el-card v-if="modelFileRef && modelFileInfoRef" class="my-8 shadow-sm rounded-lg text-left" body-style="padding: 0;">
         <template #header>
          <h2 class="font-semibold text-xl text-gray-700">模型信息</h2>
        </template>
         <div v-for="(item, index) in modelFileInfoRef" :key="item.k" class="px-5 py-3 border-b border-gray-100 last:border-b-0">
           <h3 class="font-medium text-sm text-gray-800">
            {{ item.k }}
           </h3>
           <p class="text-wrap break-all text-sm mt-1 text-gray-600 leading-relaxed" style="white-space: pre-wrap" v-if="item.k != 'Info'">
            {{ item.v }}
           </p>
           <json-viewer class="mt-1" :value="jsonData" v-if="item.k == 'Info'" :expand-depth=4></json-viewer>
         </div>
          <!-- 模型用法链接调整 -->
          <div class="px-5 py-3 text-center">
             <a class="text-sm text-blue-600 hover:text-blue-700 hover:underline" href="https://www.bilibili.com/read/cv21362202" target="_blank" rel="noopener noreferrer">
               查看常见模型用法详解
             </a>
          </div>
       </el-card>

      <!-- 7. 页脚信息: 调整间距和样式 -->
      <div class="mt-10 mb-6 text-center">
        <p class="text-gray-500 text-sm mb-4">
          * 所有文件解析运算均在您的浏览器本地进行，不会上传到任何服务器。
        </p>
        <div class="text-xs text-gray-400 space-y-1">
          <p>
            如果您觉得本项目对您有帮助，请在
            <a class="text-gray-500 hover:text-gray-700 underline" href="https://github.com/Akegarasu/stable-diffusion-inspector" target="_blank" rel="noopener noreferrer">GitHub</a>
            上点个 Star ✨
          </p>
          <p>
            <span class="inline-block">
              Made with ❤️ by
              <a class="text-gray-500 hover:text-gray-700" href="https://github.com/Akegarasu" target="_blank" rel="noopener noreferrer">@Akegarasu</a> |
              <a class="text-gray-500 hover:text-gray-700" href="https://space.bilibili.com/12566101" target="_blank" rel="noopener noreferrer">秋葉aaaki</a> |
              <a class="text-gray-500 hover:text-gray-700" href="https://novelai.dev" target="_blank" rel="noopener noreferrer">NovelAI.Dev</a> |
              Build: {{ commitHash }}
            </span>
          </p>
        </div>
      </div>

    </div> <!-- End max-w container -->
  </div> <!-- End overall container -->
</template>

<style>
/* 保持 JSON Viewer 的基本样式调整 */
.jv-container {
  line-height: 1.2;
}

.jv-code {
  padding: 10px 15px !important; /* 可以微调内边距 */
  border-radius: 4px; /* 给 JSON 查看器本身加点圆角 */
}

/* 可选: 统一 el-card 头部样式 */
.el-card__header {
  padding: 0.8rem 1.25rem; /* 调整卡片头部内边距 */
  border-bottom: 1px solid #f3f4f6; /* 使用更浅的灰色作为分隔线 (UnoCSS bg-gray-100) */
}
</style>

<script setup lang="ts">
// ... 你的 <script setup> 部分保持不变 ...
import modelsig from '../assets/modelsig.json'

import { ElMessage } from "element-plus";
import ExifReader from "exifreader";
import { ref, watch } from "vue";
import prettyBytes from "pretty-bytes";
import extractChunks from "png-chunks-extract";
import * as pngChunkText from "png-chunk-text";
import jsonViewer from "vue-json-viewer";
import { UploadFilled, CopyDocument } from "@element-plus/icons-vue";
import useClipboard from "vue-clipboard3";

import { asyncFileReaderAsDataURL, getStealthExif, getSafetensorsMeta, getSafetensorsMetaKohya } from "../utils";

const commitHash = import.meta.env.VITE_COMMIT_HASH || "unknown"

const imgFileRef = ref(null);
const imageRef = ref(null);
const exifRef = ref(null);
const imgfileInfoRef = ref(null);

const modelFileRef = ref(null);
const modelFileInfoRef = ref(null);

const jsonData = ref(null);
const imageMaxSizeRef = ref(0); // 注意：这个变量在模板中没用到，检查是否需要保留
const { toClipboard } = useClipboard();

const availableImgExt = ["png", "jpeg", "jpg", "webp", "bmp", "avif"]
const availableModelExt = ["pt", "pth", "ckpt", "safetensors", "bin"]

const copy = (value) => {
  try {
    // 如果值是 undefined 或 null，复制空字符串避免错误
    toClipboard(value ?? '');
    ElMessage({
      message: "复制成功",
      type: "success",
      duration: 1500 // 缩短提示时间
    });
  } catch (e) {
    console.error("复制失败:", e);
    ElMessage({
      message: "复制失败",
      type: "warning",
      duration: 1500
    });
  }
};

const showCopyBtn = (title) => {
  if (!title) return false
  // 简化判断逻辑
  const copyableKeys = ["Description", "Comment", "完整生成信息", "提示词", "负面提示词", "其他参数", "parameters"]; // 补充 parameters
  return copyableKeys.includes(title);
};

const showJsonViewer = (title) => {
  if (!title) return false;
  // 确保 workflow 和 Comment 确实包含有效的 JSON
  return title === "Comment" || title === "workflow";
};

const cleanData = () => {
  imgFileRef.value = null
  modelFileRef.value = null
  imgfileInfoRef.value = null
  modelFileInfoRef.value = null
  exifRef.value = null
  jsonData.value = null
  imageRef.value = null // 清理图片预览
}

// 类型注解 File | any 是不推荐的，最好能更精确，但为了兼容原始逻辑暂不修改
async function handleUpload(file: File | any) {
  console.log("Handling upload:", file);
  cleanData() // 上传新文件前清理旧数据

  let fileExt = file.name?.split(".").pop()?.toLowerCase() ?? '';

  if (!fileExt) {
     ElMessage.error("无法识别的文件类型");
     return false;
  }

  if (availableModelExt.includes(fileExt)) {
    modelFileRef.value = file
    try {
      await inspectModel(file)
    } catch (error) {
       console.error("Error inspecting model:", error);
       ElMessage.error("解析模型文件时出错");
    }
  } else if (availableImgExt.includes(fileExt)) {
    imgFileRef.value = file;
    try {
       await inspectImage(file)
    } catch (error) {
       console.error("Error inspecting image:", error);
       ElMessage.error("解析图片文件时出错");
    }
  } else {
    ElMessage({
      message: "不支持的文件类型，请选择图片或模型文件。",
      type: "warning", // 改为 warning 可能更合适
    });
  }
  // 阻止 el-upload 默认的上传行为
  return false;
}

const inspectImage = async (file) => {
  // 使用 Promise.all 并行处理，可能稍快一点
  try {
    const [imageBase64, exifData, fileInfo] = await Promise.all([
      readImageBase64(file),
      readExif(file),
      readFileInfo(file) // readFileInfo 内部会调用 readImageBase64，这里有重复调用，需要优化
    ]);
    // 注意: readImageBase64 更新 imageRef.value, readFileInfo 也依赖 imageRef.value
    // 需要调整 readFileInfo 或 readImageBase64 的逻辑避免重复或确保时序
    // 简化处理：确保 imageRef 已设置
    await readImageBase64(file); // 先确保 imageRef 设置好
    exifRef.value = await readExif(file);
    imgfileInfoRef.value = await readFileInfo(file); // readFileInfo 现在可以使用 imageRef
  } catch (error) {
     console.error("Error during image inspection:", error);
     ElMessage.error("读取图片信息失败");
     // 出错时也清理一下，避免显示不一致的数据
     cleanData();
  }
}

const inspectModel = async (file) => {
  // ... (模型解析逻辑基本保持不变，可以添加 try...catch 包装) ...
  const modelTypes = modelsig.data
  const fileSize = file.size
  const fileExt = file.name.split(".").pop().toLowerCase()

  // 增加一些基础验证
  if (!fileSize || fileSize < 1024) { // 调整最小大小判断
    modelFileInfoRef.value = [{ k: "错误", v: "🤔 文件过小或无效，请检查文件。" }];
    return;
  }

  let modelType: { name: string; identifier: string; usage: string; sigs: string[]; } | null = null; // 显式声明类型
  let knownIdentifier = modelTypes.map(x => x.identifier)
  let modelKeysContent = ""
  let metaJson = null; // 重置 jsonData

  try { // 包裹可能出错的操作
    if (fileExt === "safetensors") {
      let meta: { [x: string]: any; }
      try {
        // 尝试标准读取
        meta = await getSafetensorsMeta(file);
      } catch (e) {
        console.warn("Standard safetensors meta read failed, trying Kohya style:", e);
        // 如果标准读取失败，可以尝试 Kohya 的方式或给提示
        // 这里可以加一个标记，或者直接认为解析失败
         modelFileInfoRef.value = [{ k: "错误", v: "😈 解析 Safetensors 元数据失败，文件可能已损坏或格式不兼容。" }];
         return;
      }

      if (meta && meta["__metadata__"]) {
        // 优先使用 Kohya 的方法提取 __metadata__ 并解析嵌套 JSON
        metaJson = await getSafetensorsMetaKohya(file);
        jsonData.value = metaJson; // 更新 jsonData
      } else {
          // 如果没有 __metadata__，jsonData 设为 null 或整个 meta？取决于需求
          jsonData.value = null; // 或者 jsonData.value = meta;
      }
      // 获取顶层键（排除 __metadata__）用于签名检查
      const modelKeys = Object.keys(meta).filter(key => key !== "__metadata__");
      modelKeysContent = modelKeys.join("\n")
      console.log("Safetensors top-level keys:", modelKeysContent);

    } else {
      // 对于其他模型类型 (pt, ckpt, etc.)，读取头部文本可能不够可靠
      // 保持原有逻辑，但添加 try-catch
       try {
         modelKeysContent = await file.slice(0, 1024 * 50).text() // 50KB 可能不足以包含所有签名
         console.log("[debug] file content head: " + modelKeysContent.substring(0, 500)); // 打印部分内容
       } catch (readError) {
          console.error("Error reading model file head:", readError);
          modelFileInfoRef.value = [{ k: "错误", v: "读取模型文件头部失败。" }];
          return;
       }
    }

    // 模型类型检测逻辑保持不变
    if (metaJson && metaJson["modelspec.architecture"] && knownIdentifier.includes(metaJson["modelspec.architecture"])) {
       modelType = modelTypes.find(x => x.identifier === metaJson["modelspec.architecture"]) ?? null;
    } else {
      for (let m of modelTypes) {
        if (modelType) break;
        for (let sig of m.sigs) {
          // 使用 includes 可能不够精确，但保持原逻辑
          if (modelKeysContent.includes(sig)) {
            modelType = m
            break
          }
        }
      }
    }

    let modelTypeOk = modelType == null ? "😭 未知模型种类或非模型" : modelType.name
    let ok = [
      { k: "文件名", v: file.name },
      { k: "文件大小", v: prettyBytes(fileSize) }, // 使用下面定义的 prettyBytes
      { k: "推测模型种类", v: modelTypeOk },
    ];

    if (modelType != null) {
      ok.push({ k: "常见用途", v: modelType.usage });
    }

    // 确保 jsonData 有值且是为 Info 准备的时才显示
    if (fileExt === "safetensors" && jsonData.value) {
      ok.push({ k: "元数据 (Info)", v: jsonData.value }); // 值应该是 jsonData.value
    }
    modelFileInfoRef.value = ok;

  } catch (error) {
      console.error("Error processing model file:", error);
      modelFileInfoRef.value = [{ k: "错误", v: `处理模型文件时发生错误: ${error.message}` }];
  }

}


const extractMetadata = async (file) => {
  // ... (PNG/WebP/JPEG 提取逻辑基本不变, 可以加 try...catch) ...
  try {
    if (file.type === "image/png") {
      const buf = await file.arrayBuffer();
      let chunks = [];
      try {
        chunks = extractChunks(new Uint8Array(buf));
      } catch (err) {
        console.warn("Error extracting PNG chunks:", err);
        return []; // 返回空数组表示失败
      }
      const textChunks = chunks
        .filter(chunk => chunk.name === "tEXt" || chunk.name === "iTXt")
        .map(chunk => {
          try { // 增加对解码错误的捕获
            if (chunk.name === "iTXt") {
              // 尝试更健壮地解码 iTXt (处理可能的压缩和语言标签)
               let entry = pngChunkText.decode(chunk.data);
               // A1111 WebUI 通常用 'parameters' 作为 keyword
               if (entry.keyword === 'parameters') return entry;
               // NovelAI 可能用 Description 等
               // 保持原逻辑作为后备
               let data = chunk.data.filter((x) => x != 0x0);
               let header = new TextDecoder("utf-8", { fatal: true }).decode(data.slice(0, 11));
               if (header == "Description") { // 严格检查 Description?
                 data = data.slice(11);
                 let txt = new TextDecoder("utf-8", { fatal: true }).decode(data);
                 return { keyword: "Description", text: txt };
               } else { // 其他 iTXt 块可能不是我们需要的
                  console.log("Ignoring non-description iTXt chunk:", new TextDecoder().decode(data.slice(0, 50)));
                  return null; // 返回 null 或过滤掉
               }
            } else { // tEXt
              return pngChunkText.decode(chunk.data);
            }
          } catch (decodeError) {
              console.warn("Error decoding PNG text chunk:", decodeError);
              return null; // 解码失败则忽略该块
          }
        })
        .filter(Boolean); // 过滤掉解码失败的 null 值
      console.log("PNG Text Chunks:", textChunks);
      return textChunks;
    } else if (["image/webp", "image/jpeg", "image/avif"].includes(file.type)) {
      // 尝试读取 Exif UserComment (通常用于 WebUI)
      try {
        const data = await ExifReader.load(file);
        // WebUI 通常把参数放在 UserComment, 编码为 UTF-16LE 或 UTF-8
        if (data.UserComment?.value) {
           // UserComment 的值是一个 number[] (code points)
           let comment = "";
           try {
             // 尝试 UTF-8 解码 (常见于 A1111)
             const bytes = new Uint8Array(data.UserComment.value);
             comment = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
           } catch (e) {
              // 如果 UTF-8 失败，尝试原始逻辑（可能适用于其他编码或旧格式）
              console.warn("UTF-8 decode failed for UserComment, trying fromCodePoint:", e);
              comment = String.fromCodePoint(...data.UserComment.value);
           }
           // 移除可能的编码标识符和空字符
           comment = comment.replace(/^UNICODE\0*/, '').replace(/^ASCII\0*/, '').replace(/^JIS\0*/, '').replace(/^LATIN1\0*/, '').replace(/\0+$/, '').trim();
           if (comment) {
              console.log("Found parameters in UserComment:", comment);
              // A1111 WebUI 风格的参数通常没有 keyword，手动添加
              return [{ keyword: "parameters", text: comment }];
           }
        }
      } catch (exifError) {
         console.warn("Could not read EXIF data or UserComment:", exifError);
         // 即使 EXIF 读取失败，也继续尝试隐写术
      }
    }
  } catch (error) {
     console.error("Error extracting metadata:", error);
  }
  // 如果以上方法都失败，返回空数组
  return [];
}

async function readFileInfo(file) {
  jsonData.value = null // 重置 jsonData
  let parsed = []
  let metaSource = "未知来源"; // 记录信息来源

  // 1. 尝试标准元数据提取 (PNG chunks / EXIF UserComment)
  let metadata = await extractMetadata(file);

  // 2. 如果标准方法找不到，尝试隐写术 (需要 imageRef.value.src)
  if (metadata.length === 0) {
    console.log("No standard metadata found, trying stealth exif...");
    // 确保 imageRef 已经加载 (在 inspectImage 中已保证)
    if (imageRef.value?.src) {
       try {
         let stealthData = await getStealthExif(imageRef.value.src);
         if (stealthData) {
           console.log("Found stealth exif data:", stealthData);
           metaSource = "Stealth Exif (隐写术)";
           // 将 stealthData 转换为 keyword/text 格式
           // NovelAI 格式通常是扁平的 JSON，直接转换
           parsed = Object.entries(stealthData).map(([key, value]) => ({
             keyword: key,
             // 确保障是字符串
             text: typeof value === 'string' ? value : JSON.stringify(value)
           }));
           // NovelAI 通常把提示词放在 Description, 负面放在 Comment
           // 这里可以根据需要调整 keyword 名称以匹配界面显示
           // 例如: parsed.find(p => p.keyword === 'description')?.keyword = '提示词';
         } else {
            console.log("No stealth exif data found.");
         }
       } catch (stealthError) {
           console.error("Error reading stealth exif:", stealthError);
       }
    } else {
        console.warn("Image preview not available, cannot try stealth exif.");
    }
  } else {
     // 处理从标准方法获取的元数据
     metaSource = file.type === "image/png" ? "PNG Chunks" : "EXIF";
     // WebUI (A1111) 参数通常在 'parameters' 或 'Comment'/'Description' keyword 下
     let parametersEntry = metadata.find(m => m.keyword === 'parameters');
     if (parametersEntry) {
        console.log("Processing A1111 WebUI style parameters:", parametersEntry.text);
        metaSource = "A1111 WebUI";
        parsed = handleWebUiTag(parametersEntry);
     } else {
        // 处理其他格式 (可能是 NovelAI 或 ComfyUI 等)
        // ComfyUI 可能在 'prompt' 和 'workflow'
        let workflowEntry = metadata.find(m => m.keyword === 'workflow');
        if (workflowEntry) {
            metaSource = "ComfyUI";
            try {
               jsonData.value = JSON.parse(workflowEntry.text); // 解析 workflow JSON
               parsed.push({ keyword: 'workflow', text: workflowEntry.text }); // 保留原始 workflow
               // 尝试从 workflow JSON 中提取 prompt (如果存在)
               let promptJson = jsonData.value; // 假设 workflow 本身就是 prompt
               // 这里需要更复杂的逻辑来解析 ComfyUI workflow 提取关键参数，暂时简化
               // parsed.push({ keyword: '提示词 (来自 Workflow)', text: JSON.stringify(promptJson, null, 2)});
            } catch (jsonError) {
               console.warn("Could not parse workflow JSON:", jsonError);
               parsed.push({ keyword: 'workflow (原始)', text: workflowEntry.text });
            }
        }
        // 加入其他找到的块
        metadata.forEach(m => {
           // 避免重复添加已处理的块
           if (!parsed.some(p => p.keyword === m.keyword)) {
              parsed.push(m);
           }
        });
        // 尝试标准化常见关键字
        parsed.forEach(p => {
            if (p.keyword === 'Description') p.keyword = '提示词 (Description)';
            if (p.keyword === 'Comment') p.keyword = '负面提示词 (Comment)'; // 假设 Comment 是负面
        });
     }
  }

  // 构建最终显示结果
  let ok = [
    { key: "文件名", value: file.name },
    { key: "文件大小", value: prettyBytes(file.size) },
    { key: "元数据来源", value: metaSource }
  ];

  if (parsed.length > 0) {
     // 将解析出的数据添加到结果中
     ok.push(...parsed.map(v => ({
       key: v.keyword,
       value: v.text,
     })));
     // 重新检查并设置 jsonData 用于 JSON Viewer (如果 keyword 匹配)
     parsed.forEach(v => {
        if (showJsonViewer(v.keyword)) {
            try {
                jsonData.value = JSON.parse(v.text);
            } catch (e) {
                console.warn(`Value for ${v.keyword} is not valid JSON:`, v.text);
                // 如果解析失败，可以让 JSON Viewer 显示原始文本或错误信息
                // jsonData.value = { error: "Invalid JSON", raw: v.text };
            }
        }
     });

  } else {
    // 如果 parsed 仍然为空，说明所有方法都失败了
    ok.push({
      key: "提示",
      value: "😭 无法读取到有效的图像元数据。图片可能不是由 SD 生成，或已被压缩/编辑。",
    });
  }

  return ok;
}

// WebUI 参数解析保持不变
const handleWebUiTag = (data) => {
  let text = data.text || '';
  let [prompts = '', rest = ''] = text.split("Negative prompt:");
  let [negativePrompt = '', params = ''] = rest.split("Steps:");

  // 清理可能的前后空格或换行
  prompts = prompts.trim();
  negativePrompt = negativePrompt.trim();
  params = params ? ("Steps:" + params).trim() : ''; // 重新加上 Steps:

  return [
    { keyword: "提示词", text: prompts || "无" }, // 处理空提示词情况
    { keyword: "负面提示词", text: negativePrompt || "无" },
    { keyword: "其他参数", text: params || "无" },
  ];
}

// readImageBase64 保持不变
const readImageBase64 = async (file) => {
  imageRef.value = null;
  try {
     let result = await asyncFileReaderAsDataURL(file)
     const image = new Image();
     image.src = result;
     await image.decode(); // 等待图片解码完成，确保获取正确的宽高
     const { width, height } = image;
     imageRef.value = {
       width,
       height,
       src: result,
     };
     // imageMaxSizeRef.value = width; // 更新这个值如果还需要用的话
  } catch (error) {
      console.error("Error reading image as Base64:", error);
      ElMessage.error("读取图片预览失败");
      imageRef.value = null; // 确保失败时 imageRef 是 null
  }
}

// readExif 保持不变，增加错误处理
const readExif = async (file) => {
  try {
    const data = await ExifReader.load(file);
    // 过滤掉空的或不必要的 EXIF 字段（可选）
    const entries = Object.entries(data).filter(([key, value]) => value?.description); // 仅保留有 description 的
    return entries.map(([key, value]) => ({ key, value }));
  }
  catch (error) {
    // MetadataMissingError 是 ExifReader 可能抛出的特定错误
    if (error.name === 'MetadataMissingError') {
        console.log("No EXIF metadata found in the image.");
    } else {
        console.warn("Error reading EXIF data:", error);
    }
    return []; // 返回空数组表示没有 EXIF 或读取失败
  }
}

// prettyBytes 函数移到这里，因为它只在这个文件用
const prettyBytes = (num, precision = 2, addSpace = true) => {
	const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	if (Math.abs(num) < 1) return num + (addSpace ? ' ' : '') + UNITS[0];
	const exponent = Math.min(Math.floor(Math.log10(num < 0 ? -num : num) / 3), UNITS.length - 1);
	const n = Number(((num < 0 ? -num : num) / 1000 ** exponent).toPrecision(precision));
	return (num < 0 ? '-' : '') + n + (addSpace ? ' ' : '') + UNITS[exponent];
};


</script>