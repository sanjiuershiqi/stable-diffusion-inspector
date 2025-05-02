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
import modelsig from '../assets/modelsig.json'

import { ElMessage } from "element-plus";
import ExifReader from "exifreader";
import { ref } from "vue"; // watch 未使用，可以移除
import prettyBytes from "pretty-bytes"; // <-- 保留导入语句
import extractChunks from "png-chunks-extract";
import * as pngChunkText from "png-chunk-text";
import jsonViewer from "vue-json-viewer";
import { UploadFilled, CopyDocument } from "@element-plus/icons-vue";
import useClipboard from "vue-clipboard3";

// 假设 utils.ts 在 '../utils' 路径下
import { asyncFileReaderAsDataURL, getStealthExif, getSafetensorsMeta, getSafetensorsMetaKohya } from "../utils";

const commitHash = import.meta.env.VITE_COMMIT_HASH || "unknown"

const imgFileRef = ref<File | null>(null);
const imageRef = ref<{ width: number; height: number; src: string } | null>(null);
const exifRef = ref<Array<{ key: string; value: any }> | null>(null);
const imgfileInfoRef = ref<Array<{ key: string; value: string }> | null>(null);

const modelFileRef = ref<File | null>(null);
const modelFileInfoRef = ref<Array<{ k: string; v: any }> | null>(null); // v 的类型可能是字符串或对象

const jsonData = ref<any>(null); // 用于 JSON Viewer 的数据
// const imageMaxSizeRef = ref(0); // 未在模板中使用，如果不需要可以删除
const { toClipboard } = useClipboard();

const availableImgExt = ["png", "jpeg", "jpg", "webp", "bmp", "avif"]
const availableModelExt = ["pt", "pth", "ckpt", "safetensors", "bin"]

const copy = async (value: any) => { // 添加 async 标记，因为 toClipboard 返回 Promise
  try {
    await toClipboard(value ?? ''); // 使用 await 等待复制完成，处理 null/undefined
    ElMessage({
      message: "复制成功",
      type: "success",
      duration: 1500
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

const showCopyBtn = (title: string): boolean => {
  if (!title) return false
  const copyableKeys = ["Description", "Comment", "完整生成信息", "提示词", "负面提示词", "其他参数", "parameters", "workflow"]; // 添加 workflow
  return copyableKeys.includes(title);
};

const showJsonViewer = (title: string): boolean => {
  if (!title) return false;
  // Comment, workflow 和 Info 通常可能包含 JSON
  return ["Comment", "workflow", "Info", "元数据 (Info)"].includes(title);
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

// 为 File 参数添加类型注解
async function handleUpload(file: File) {
  console.log("Handling upload:", file.name, file.type, file.size);
  cleanData() // 上传新文件前清理旧数据

  let fileExt = file.name?.split(".").pop()?.toLowerCase() ?? '';

  if (!fileExt || !file.size) { // 增加对 0 字节文件的检查
     ElMessage.error("无效的文件或无法识别的文件类型");
     return false;
  }

  if (availableModelExt.includes(fileExt)) {
    modelFileRef.value = file
    try {
      await inspectModel(file)
    } catch (error) {
       console.error("Error inspecting model:", error);
       ElMessage.error("解析模型文件时出错");
       // 清理可能部分成功的数据
       modelFileInfoRef.value = null;
       jsonData.value = null;
    }
  } else if (availableImgExt.includes(fileExt)) {
    imgFileRef.value = file;
    try {
       await inspectImage(file)
    } catch (error) {
       console.error("Error inspecting image:", error);
       ElMessage.error("解析图片文件时出错");
       // 清理可能部分成功的数据
       imgfileInfoRef.value = null;
       exifRef.value = null;
       jsonData.value = null;
       imageRef.value = null;
    }
  } else {
    ElMessage({
      message: "不支持的文件类型，请选择图片或模型文件。",
      type: "warning",
    });
  }
  // 阻止 el-upload 默认的上传行为
  return false;
}

const inspectImage = async (file: File) => {
  try {
    // 1. 先读取图片用于预览和后续隐写术检查
    await readImageBase64(file);
    if (!imageRef.value) {
        // 如果读取预览失败，则无法进行后续操作
        throw new Error("无法加载图片预览");
    }

    // 2. 并行读取 EXIF 和 文件信息（包含标准元数据和隐写术检查）
    const [exifData, fileInfo] = await Promise.all([
        readExif(file),
        readFileInfo(file) // readFileInfo 内部会检查 imageRef.value 是否存在
    ]);

    exifRef.value = exifData;
    imgfileInfoRef.value = fileInfo;

  } catch (error) {
     console.error("Error during image inspection:", error);
     ElMessage.error(`读取图片信息失败: ${error.message}`);
     // 出错时也清理一下，避免显示不一致的数据
     cleanData();
  }
}

const inspectModel = async (file: File) => {
  const modelTypes = modelsig.data
  const fileSize = file.size
  const fileExt = file.name.split(".").pop()?.toLowerCase() ?? ''; // 添加空检查

  // 增加一些基础验证
  if (!fileSize || fileSize < 1024) { // 调整最小大小判断
    modelFileInfoRef.value = [{ k: "错误", v: "🤔 文件过小或无效，请检查文件。" }];
    return;
  }

  let modelType: { name: string; identifier: string; usage: string; sigs: string[]; } | null = null;
  let knownIdentifier = modelTypes.map(x => x.identifier)
  let modelKeysContent = ""
  let meta = null; // 用于存储 Safetensors 的完整元数据
  let metaJson = null; // 用于存储 __metadata__ 部分

  jsonData.value = null; // 重置 jsonData

  try {
    if (fileExt === "safetensors") {
      try {
        meta = await getSafetensorsMeta(file); // 获取完整元数据
        if (meta && meta["__metadata__"]) {
           // 尝试用 Kohya 方法解析 __metadata__
           metaJson = await getSafetensorsMetaKohya(file);
           jsonData.value = metaJson; // 设置 jsonData 用于显示
        } else {
            console.log("Safetensors file does not contain __metadata__ field.");
            // jsonData.value = meta; // 如果需要显示整个 meta，取消这行注释
        }
        // 获取顶层键（排除 __metadata__）用于签名检查
        const modelKeys = Object.keys(meta ?? {}).filter(key => key !== "__metadata__");
        modelKeysContent = modelKeys.join("\n")
        console.log("Safetensors top-level keys:", modelKeys.slice(0, 20).join(", ") + "..."); // 打印部分键
      } catch (e) {
        console.error("Failed to parse Safetensors metadata:", e);
        modelFileInfoRef.value = [{ k: "错误", v: "😈 解析 Safetensors 元数据失败，文件可能已损坏或格式不兼容。" }];
        return;
      }
    } else { // 其他模型类型 (pt, ckpt, etc.)
       try {
         // 限制读取大小，避免读取过大文件导致浏览器卡死
         const headSize = Math.min(fileSize, 1024 * 100); // 读取最多 100KB
         modelKeysContent = await file.slice(0, headSize).text();
         console.log("[debug] file content head sample: " + modelKeysContent.substring(0, 500)); // 打印部分内容
       } catch (readError) {
          console.error("Error reading model file head:", readError);
          modelFileInfoRef.value = [{ k: "错误", v: "读取模型文件头部失败。" }];
          return;
       }
    }

    // 模型类型检测逻辑
    if (metaJson && metaJson["modelspec.architecture"] && knownIdentifier.includes(metaJson["modelspec.architecture"])) {
       modelType = modelTypes.find(x => x.identifier === metaJson["modelspec.architecture"]) ?? null;
    } else if (meta && meta["modelspec.architecture"] && knownIdentifier.includes(meta["modelspec.architecture"])) { // 备选：检查整个 meta
       modelType = modelTypes.find(x => x.identifier === meta["modelspec.architecture"]) ?? null;
    } else { // 通过签名猜测
      for (let m of modelTypes) {
        if (modelType) break;
        for (let sig of m.sigs) {
          if (modelKeysContent.includes(sig)) {
            modelType = m;
            console.log(`Model type possibly identified as "${m.name}" by signature "${sig}"`);
            break;
          }
        }
      }
    }

    let modelTypeOk = modelType == null ? "😭 未知模型种类或非模型" : modelType.name;
    let ok = [
      { k: "文件名", v: file.name },
      { k: "文件大小", v: prettyBytes(fileSize) },
      { k: "推测模型种类", v: modelTypeOk },
    ];

    if (modelType != null) {
      ok.push({ k: "常见用途", v: modelType.usage });
    }

    // 只有当 jsonData 确实是通过解析 __metadata__ 得到的时候才作为 "Info" 显示
    if (fileExt === "safetensors" && jsonData.value === metaJson && metaJson) {
       ok.push({ k: "元数据 (Info)", v: jsonData.value }); // 这里的 key 匹配 showJsonViewer
    } else if (fileExt === 'safetensors' && meta) {
        // 如果没有 __metadata__，但想显示整个 meta
        // ok.push({ k: "完整元数据", v: meta });
        // jsonData.value = meta; // 可以在这里设置 jsonData 显示整个 meta
    }
    modelFileInfoRef.value = ok;

  } catch (error) {
      console.error("Error processing model file:", error);
      modelFileInfoRef.value = [{ k: "错误", v: `处理模型文件时发生错误: ${error.message}` }];
  }
}


const extractMetadata = async (file: File): Promise<Array<{ keyword: string; text: string }>> => {
  try {
    if (file.type === "image/png") {
      const buf = await file.arrayBuffer();
      let chunks = [];
      try {
        chunks = extractChunks(new Uint8Array(buf));
      } catch (err) {
        console.warn("Error extracting PNG chunks:", err);
        return [];
      }
      const textChunks = chunks
        .filter(chunk => chunk.name === "tEXt" || chunk.name === "iTXt")
        .map(chunk => {
          try {
            // 尝试使用库解码，库通常能处理更多情况
            let entry = pngChunkText.decode(chunk.data);
            console.log(`Decoded ${chunk.name} chunk: keyword='${entry.keyword}'`);
            // 标准化常见的 keyword
            if (entry.keyword === 'parameters') return entry; // A1111 WebUI in iTXt or tEXt
            if (entry.keyword === 'prompt') return entry; // ComfyUI in tEXt
            if (entry.keyword === 'workflow') return entry; // ComfyUI in tEXt
            // 其他如 Description, Comment 等也可能是目标
            return entry;
          } catch (decodeError) {
              console.warn(`Error decoding ${chunk.name} chunk:`, decodeError);
              return null;
          }
        })
        .filter((entry): entry is { keyword: string; text: string } => entry !== null); // 类型守卫过滤 null
      console.log("PNG Text Chunks:", textChunks);
      return textChunks;

    } else if (["image/webp", "image/jpeg", "image/avif"].includes(file.type)) {
      try {
        const data = await ExifReader.load(file);
        if (data.UserComment?.value) {
           let comment = "";
           try {
             const bytes = new Uint8Array(data.UserComment.value);
             comment = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
           } catch (e) {
              console.warn("UTF-8 decode failed for UserComment, trying fromCodePoint:", e);
              try { // 添加内部 try-catch
                 comment = String.fromCodePoint(...data.UserComment.value);
              } catch (fromCodePointError) {
                  console.error("fromCodePoint failed for UserComment:", fromCodePointError);
                  comment = ""; // 失败则为空
              }
           }
           comment = comment.replace(/^UNICODE\0*/, '').replace(/^ASCII\0*/, '').replace(/^JIS\0*/, '').replace(/^LATIN1\0*/, '').replace(/\0+$/, '').trim();
           if (comment) {
              console.log("Found parameters in UserComment:", comment);
              return [{ keyword: "parameters", text: comment }];
           }
        }
      } catch (exifError) {
         console.warn("Could not read EXIF data or UserComment:", exifError);
         // 继续，后面可能会尝试隐写术
      }
    }
  } catch (error) {
     console.error("Error extracting metadata:", error);
  }
  return []; // 默认返回空数组
}

async function readFileInfo(file: File): Promise<Array<{ key: string; value: string }>> {
  jsonData.value = null // 重置 jsonData
  let parsed: Array<{ keyword: string; text: string }> = [];
  let metaSource = "未知来源";

  // 1. 尝试标准元数据提取 (PNG chunks / EXIF UserComment)
  try {
      metadata = await extractMetadata(file);
  } catch(extractErr) {
      console.error("Failed to extract standard metadata:", extractErr);
      metadata = []; // 确保 metadata 是数组
  }


  // 2. 如果标准方法找不到，尝试隐写术 (需要 imageRef.value.src)
  if (metadata.length === 0) {
    console.log("No standard metadata found, trying stealth exif...");
    if (imageRef.value?.src) {
       try {
         let stealthData = await getStealthExif(imageRef.value.src);
         if (stealthData) {
           console.log("Found stealth exif data:", stealthData);
           metaSource = "Stealth Exif (隐写术)";
           parsed = Object.entries(stealthData).map(([key, value]) => ({
             keyword: key,
             text: typeof value === 'string' ? value : JSON.stringify(value)
           }));
           // 标准化 NovelAI 常见关键字
           parsed.forEach(p => {
               if (p.keyword.toLowerCase() === 'description') p.keyword = '提示词 (Description)';
               if (p.keyword.toLowerCase() === 'comment') p.keyword = '参数 (Comment)'; // NovelAI Comment 通常是参数 JSON
           });
         } else {
            console.log("No stealth exif data found.");
         }
       } catch (stealthError) {
           console.error("Error reading stealth exif:", stealthError);
           // 不阻塞，继续执行
       }
    } else {
        console.warn("Image preview not available, cannot try stealth exif.");
    }
  } else {
     // 处理从标准方法获取的元数据
     metaSource = file.type === "image/png" ? "PNG Chunks" : "EXIF";
     let parametersEntry = metadata.find(m => m.keyword === 'parameters');
     let workflowEntry = metadata.find(m => m.keyword === 'workflow');
     let promptEntry = metadata.find(m => m.keyword === 'prompt'); // ComfyUI prompt

     if (parametersEntry) { // 优先处理 A1111 WebUI 风格
        console.log("Processing A1111 WebUI style parameters:", parametersEntry.text);
        metaSource = "A1111 WebUI";
        parsed = handleWebUiTag(parametersEntry);
     } else if (workflowEntry || promptEntry) { // 处理 ComfyUI 风格
        metaSource = "ComfyUI";
        if (workflowEntry) {
            try {
               jsonData.value = JSON.parse(workflowEntry.text);
               parsed.push({ keyword: 'workflow', text: workflowEntry.text });
            } catch (jsonError) {
               console.warn("Could not parse workflow JSON:", jsonError);
               parsed.push({ keyword: 'workflow (原始文本)', text: workflowEntry.text });
            }
        }
        if (promptEntry) {
             try {
               // ComfyUI prompt 通常也是 JSON
               let promptJson = JSON.parse(promptEntry.text);
               // 提取关键信息比较复杂，先直接展示
               parsed.push({ keyword: 'prompt (JSON)', text: promptEntry.text });
               // 如果 workflow 不存在，也尝试把 prompt 放入 jsonData
               if (!jsonData.value) jsonData.value = promptJson;
             } catch (jsonError) {
                 console.warn("Could not parse prompt JSON:", jsonError);
                 parsed.push({ keyword: 'prompt (原始文本)', text: promptEntry.text });
             }
        }
        // 把其他 metadata 也加进来（如果有的话）
        metadata.forEach(m => {
           if (m !== parametersEntry && m !== workflowEntry && m !== promptEntry) {
              parsed.push(m);
           }
        });
     } else {
        // 其他情况，可能是 NovelAI 的 tEXt 或其他工具
        parsed = metadata;
        // 尝试标准化
        parsed.forEach(p => {
            if (p.keyword.toLowerCase() === 'description') p.keyword = '提示词 (Description)';
            if (p.keyword.toLowerCase() === 'comment') p.keyword = '参数 (Comment)'; // 假设 Comment 是参数
        });
     }
  }

  // 构建最终显示结果
  let ok = [
    { key: "文件名", value: file.name },
    { key: "文件大小", value: prettyBytes(file.size) },
    { key: "推测元数据来源", value: metaSource } // 更新 key 名称
  ];

  if (parsed.length > 0) {
     ok.push(...parsed.map(v => ({
       key: v.keyword,
       value: v.text,
     })));
     // 检查是否需要为 JSON Viewer 设置 jsonData
     parsed.forEach(v => {
        if (showJsonViewer(v.keyword) && !jsonData.value) { // 仅当 jsonData 未被设置时再尝试
            try {
                jsonData.value = JSON.parse(v.text);
            } catch (e) {
                console.warn(`Value for ${v.keyword} is not valid JSON:`, v.text.substring(0, 100) + "...");
            }
        }
     });
  } else if (metaSource !== "Stealth Exif (隐写术)") { // 如果隐写术也没找到，才显示最终错误
    ok.push({
      key: "提示",
      value: "😭 无法读取到有效的图像元数据。图片可能不是由 SD 生成，或已被压缩/编辑。",
    });
  } else if (parsed.length === 0 && metaSource === "Stealth Exif (隐写术)") {
      // 如果尝试了隐写术但没找到，可以给个不同的提示
      ok.push({ key: "提示", value: "未在图片中检测到隐藏的元数据。" });
  }


  return ok;
}

const handleWebUiTag = (data: { keyword: string; text: string }): Array<{ keyword: string; text: string }> => {
  let text = data.text || '';
  // 分割 Negative prompt
  let negativePromptIndex = text.indexOf("Negative prompt:");
  let paramsIndex = text.indexOf("Steps:");
  let prompts = "";
  let negativePrompt = "";
  let params = "";

  if (negativePromptIndex !== -1) {
      prompts = text.substring(0, negativePromptIndex).trim();
      if (paramsIndex !== -1 && paramsIndex > negativePromptIndex) {
          negativePrompt = text.substring(negativePromptIndex + "Negative prompt:".length, paramsIndex).trim();
          params = text.substring(paramsIndex).trim();
      } else { // 没有 Steps: 或 Steps: 在 Negative prompt: 之前
          negativePrompt = text.substring(negativePromptIndex + "Negative prompt:".length).trim();
          params = ""; // 假设没有其他参数
      }
  } else if (paramsIndex !== -1) { // 只有 Steps: 没有 Negative prompt:
      prompts = text.substring(0, paramsIndex).trim();
      negativePrompt = ""; // 无负面提示词
      params = text.substring(paramsIndex).trim();
  } else { // 既没有 Negative prompt: 也没有 Steps:，全部视为提示词
      prompts = text.trim();
      negativePrompt = "";
      params = "";
  }


  return [
    { keyword: "提示词", text: prompts || "无" },
    { keyword: "负面提示词", text: negativePrompt || "无" },
    { keyword: "其他参数", text: params || "无" },
  ];
}

const readImageBase64 = async (file: File) => {
  imageRef.value = null; // 先清空
  try {
     let result = await asyncFileReaderAsDataURL(file)
     const image = new Image();
     image.src = result;
     // 等待图片加载完成，否则宽高可能是 0
     await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
     });
     const { width, height } = image;
     // 增加对获取宽高失败的判断
     if (width === 0 || height === 0) {
         throw new Error("无法获取图片尺寸，图片可能已损坏或格式不支持。");
     }
     imageRef.value = {
       width,
       height,
       src: result,
     };
  } catch (error) {
      console.error("Error reading image as Base64:", error);
      ElMessage.error(`读取图片预览失败: ${error.message}`);
      imageRef.value = null;
  }
}

const readExif = async (file: File): Promise<Array<{ key: string; value: any }>> => {
  try {
    const data = await ExifReader.load(file);
    // 过滤掉 description 为空的字段，并对 key 做一些清理
    const entries = Object.entries(data)
        .filter(([key, value]) => value?.description && String(value.description).trim() !== '') // 确保 description 非空
        .map(([key, value]) => ({ key: key.replace(/([A-Z])/g, ' $1').trim(), value })); // 将驼峰转为带空格的词组
    return entries;
  }
  catch (error: any) { // 添加 : any 或更具体的类型
    if (error.name === 'MetadataMissingError' || error.message?.includes('No EXIF data')) { // 检查特定错误消息
        console.log("No EXIF metadata found in the image.");
    } else {
        console.warn("Error reading EXIF data:", error);
    }
    return [];
  }
}

// 删除重复的 prettyBytes 函数定义，只保留顶部的 import

</script>