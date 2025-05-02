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
        <div v-for="(item, index) in imgfileInfoRef" :key="item.key + '-' + index" class="px-5 py-3 border-b border-gray-100 last:border-b-0"> <!-- 增加 index 到 key 确保唯一性 -->
          <h3 class="font-medium text-sm text-gray-800 flex items-center">
            <span>{{ item.key }}</span>
            <!-- 复制按钮调整 -->
            <el-popover placement="top-start" trigger="hover" content="点击复制" :width="60" v-if="showCopyBtn(item.key)">
              <template #reference>
                <!-- 修正 copy 函数调用，确保访问 jsonData 正确 -->
                <el-button class="ml-2 p-0" style="min-height: auto; height: auto;" :icon="CopyDocument" text circle @click="copy(item.value)" />
              </template>
            </el-popover>
          </h3>
          <!-- 调整值显示样式，增加行高 -->
          <p class="text-wrap break-all text-sm mt-1 text-gray-600 leading-relaxed" style="white-space: pre-wrap" v-if="!showJsonViewer(item.key)">
            {{ item.value }}
          </p>
          <!-- JSON 查看器 -->
          <json-viewer class="mt-1" :value="jsonData" v-if="jsonData != null && showJsonViewer(item.key)" :expand-depth=4 copyable boxed sort> <!-- 添加 copyable boxed sort 属性 -->
          </json-viewer>
        </div>
      </el-card>

      <!-- EXIF 信息卡片 -->
      <el-card v-if="imgFileRef && exifRef && exifRef.length > 0" class="my-8 shadow-sm rounded-lg text-left" body-style="padding: 0;">
         <template #header>
          <h2 class="font-semibold text-xl text-gray-700">EXIF 元数据</h2>
        </template>
         <div v-for="(item, index) in exifRef" :key="item.key + '-' + index" class="px-5 py-3 border-b border-gray-100 last:border-b-0"> <!-- 增加 index 到 key -->
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
         <div v-for="(item, index) in modelFileInfoRef" :key="item.k + '-' + index" class="px-5 py-3 border-b border-gray-100 last:border-b-0"> <!-- 增加 index 到 key -->
           <h3 class="font-medium text-sm text-gray-800">
            {{ item.k }}
           </h3>
           <!-- 调整 v-if 条件，确保 v 存在时才显示 p -->
           <p class="text-wrap break-all text-sm mt-1 text-gray-600 leading-relaxed" style="white-space: pre-wrap" v-if="item.k !== '元数据 (Info)' && item.v !== undefined && item.v !== null">
            {{ item.v }}
           </p>
           <!-- JSON 查看器 -->
           <json-viewer class="mt-1" :value="jsonData" v-if="jsonData != null && showJsonViewer(item.k)" :expand-depth=4 copyable boxed sort> <!-- 添加 copyable boxed sort -->
           </json-viewer>
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
.jv-container.boxed { /* 确保样式应用到 boxed 模式 */
  border-radius: 4px; /* 给 JSON 查看器本身加点圆角 */
}
.jv-container .jv-code { /* 调整内边距 */
  padding: 10px 15px !important;
}

/* 可选: 统一 el-card 头部样式 */
.el-card__header {
  padding: 0.8rem 1.25rem; /* 调整卡片头部内边距 */
  border-bottom: 1px solid #f3f4f6; /* 使用更浅的灰色作为分隔线 (UnoCSS bg-gray-100) */
}

/* 可选: 移除 el-upload 拖拽区域的默认边框，如果卡片化后觉得多余 */
.el-upload-dragger {
  border: 1px dashed #d9d9d9; /* 或者设置为 none */
  background-color: #fff; /* 确保有背景色 */
}
.el-upload-dragger:hover {
  border-color: #409EFF; /* Element Plus 主题色 */
}
</style>

<script setup lang="ts">
// --- 依赖导入 ---
import modelsig from '../assets/modelsig.json' // 假设 JSON 在这里

import { ElMessage } from "element-plus";
import ExifReader from "exifreader";
import { ref } from "vue"; // watch 未使用，已移除
import prettyBytes from "pretty-bytes"; // <-- 确认只保留了导入
import extractChunks from "png-chunks-extract";
import * as pngChunkText from "png-chunk-text";
// @ts-ignore // 如果没有类型定义，可以忽略 ts 检查
import jsonViewer from "vue-json-viewer/ssr"; // 尝试导入 SSR 版本看是否兼容性更好
import { UploadFilled, CopyDocument } from "@element-plus/icons-vue";
import useClipboard from "vue-clipboard3";

// 假设 utils.ts 在 '../utils' 路径下并导出所需函数
import { asyncFileReaderAsDataURL, getStealthExif, getSafetensorsMeta, getSafetensorsMetaKohya } from "../utils";

// --- 状态变量 ---
const commitHash = import.meta.env.VITE_COMMIT_HASH || "unknown"

const imgFileRef = ref<File | null>(null);
const imageRef = ref<{ width: number; height: number; src: string } | null>(null);
const exifRef = ref<Array<{ key: string; value: any }> | null>(null); // value 类型不确定，保持 any
const imgfileInfoRef = ref<Array<{ key: string; value: string }> | null>(null);

const modelFileRef = ref<File | null>(null);
const modelFileInfoRef = ref<Array<{ k: string; v: any }> | null>(null); // v 的类型可能是字符串或对象

// jsonData 用于存储需要给 json-viewer 显示的解析后的 JSON 对象
const jsonData = ref<any>(null);
const { toClipboard } = useClipboard();

// --- 常量 ---
const availableImgExt = ["png", "jpeg", "jpg", "webp", "bmp", "avif"];
const availableModelExt = ["pt", "pth", "ckpt", "safetensors", "bin"];

// --- 方法 ---

// 复制功能
const copy = async (value: any) => {
  try {
    // 如果是对象或数组，先转成 JSON 字符串再复制
    const textToCopy = (typeof value === 'object' && value !== null) ? JSON.stringify(value, null, 2) : (value ?? '');
    await toClipboard(textToCopy);
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

// 判断是否显示复制按钮
const showCopyBtn = (title: string): boolean => {
  if (!title) return false;
  // 可以根据需要调整哪些字段允许复制
  const copyableKeys = ["Description", "Comment", "完整生成信息", "提示词", "负面提示词", "其他参数", "parameters", "workflow", "prompt (JSON)", "prompt (原始文本)", "workflow (原始文本)"];
  // 检查 title 是否以这些已知 key 开头或完全匹配
  return copyableKeys.some(key => title.startsWith(key));
};

// 判断是否应该使用 JSON 查看器显示
const showJsonViewer = (title: string): boolean => {
  if (!title) return false;
  // Comment, workflow, Info, prompt (JSON) 这些可能包含 JSON
  const jsonKeys = ["Comment", "workflow", "Info", "元数据 (Info)", "prompt (JSON)", "参数 (Comment)"];
  return jsonKeys.some(key => title.startsWith(key));
};

// 清理数据
const cleanData = () => {
  imgFileRef.value = null;
  modelFileRef.value = null;
  imgfileInfoRef.value = null;
  modelFileInfoRef.value = null;
  exifRef.value = null;
  jsonData.value = null;
  imageRef.value = null; // 清理图片预览
}

// 处理文件上传
async function handleUpload(file: File) {
  console.log("Handling upload:", file.name, file.type, file.size);
  cleanData(); // 清理旧数据

  const fileExt = file.name?.split(".").pop()?.toLowerCase() ?? '';

  if (!fileExt || !file.size) {
     ElMessage.error("无效的文件或无法识别的文件类型");
     return false;
  }

  if (availableModelExt.includes(fileExt)) {
    modelFileRef.value = file;
    try {
      await inspectModel(file);
    } catch (error: any) { // 显式添加类型或 any
       console.error("Error inspecting model:", error);
       ElMessage.error(`解析模型文件时出错: ${error.message}`);
       modelFileInfoRef.value = null;
       jsonData.value = null;
    }
  } else if (availableImgExt.includes(fileExt)) {
    imgFileRef.value = file;
    try {
       await inspectImage(file);
    } catch (error: any) { // 显式添加类型或 any
       console.error("Error inspecting image:", error);
       ElMessage.error(`解析图片文件时出错: ${error.message}`);
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
  return false; // 阻止 el-upload 默认上传
}

// 检查图片文件
const inspectImage = async (file: File) => {
  try {
    // 1. 读取图片预览
    await readImageBase64(file);
    if (!imageRef.value) {
        throw new Error("无法加载图片预览");
    }

    // 2. 并行读取 EXIF 和 解析文件信息（包括标准元数据和隐写术）
    const [exifData, fileInfo] = await Promise.all([
        readExif(file),
        readFileInfo(file) // readFileInfo 会使用 imageRef.value
    ]);

    exifRef.value = exifData;
    imgfileInfoRef.value = fileInfo;

  } catch (error: any) { // 添加类型
     console.error("Error during image inspection:", error);
     ElMessage.error(`读取图片信息失败: ${error.message}`);
     cleanData(); // 出错时清理数据
  }
}

// 检查模型文件
const inspectModel = async (file: File) => {
  const modelTypes = modelsig.data;
  const fileSize = file.size;
  const fileExt = file.name.split(".").pop()?.toLowerCase() ?? '';

  if (!fileSize || fileSize < 1024) {
    modelFileInfoRef.value = [{ k: "错误", v: "🤔 文件过小或无效，请检查文件。" }];
    return;
  }

  let modelType: { name: string; identifier: string; usage: string; sigs: string[]; } | null = null;
  const knownIdentifier = modelTypes.map(x => x.identifier);
  let modelKeysContent = "";
  let meta = null; // Safetensors 完整元数据
  let metaJson = null; // __metadata__ 部分

  jsonData.value = null; // 重置 jsonData

  try {
    if (fileExt === "safetensors") {
      try {
        meta = await getSafetensorsMeta(file);
        if (meta && meta["__metadata__"]) {
           metaJson = await getSafetensorsMetaKohya(file); // 假设这个函数只返回 __metadata__ 部分
           jsonData.value = metaJson;
        } else {
            console.log("Safetensors file does not contain __metadata__ field.");
            // 可以选择将整个 meta 放入 jsonData 以供查看
            // jsonData.value = meta;
        }
        const modelKeys = Object.keys(meta ?? {}).filter(key => key !== "__metadata__");
        modelKeysContent = modelKeys.join("\n");
        console.log("Safetensors top-level keys sample:", modelKeys.slice(0, 20).join(", ") + "...");
      } catch (e: any) { // 添加类型
        console.error("Failed to parse Safetensors metadata:", e);
        modelFileInfoRef.value = [{ k: "错误", v: `解析 Safetensors 元数据失败: ${e.message}` }];
        return;
      }
    } else { // 其他模型类型
       try {
         const headSize = Math.min(fileSize, 1024 * 100); // 读取最多 100KB
         modelKeysContent = await file.slice(0, headSize).text();
         console.log("[debug] file content head sample: " + modelKeysContent.substring(0, 500));
       } catch (readError: any) { // 添加类型
          console.error("Error reading model file head:", readError);
          modelFileInfoRef.value = [{ k: "错误", v: `读取模型文件头部失败: ${readError.message}` }];
          return;
       }
    }

    // 模型类型检测
    // 优先检查解析出的 __metadata__
    if (metaJson && metaJson["modelspec.architecture"] && knownIdentifier.includes(metaJson["modelspec.architecture"])) {
       modelType = modelTypes.find(x => x.identifier === metaJson["modelspec.architecture"]) ?? null;
    } else if (meta && meta["modelspec.architecture"] && knownIdentifier.includes(meta["modelspec.architecture"])) { // 检查完整 meta
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

    const modelTypeOk = modelType == null ? "😭 未知模型种类或非模型" : modelType.name;
    let ok = [
      { k: "文件名", v: file.name },
      { k: "文件大小", v: prettyBytes(fileSize) }, // 使用导入的 prettyBytes
      { k: "推测模型种类", v: modelTypeOk },
    ];

    if (modelType != null) {
      ok.push({ k: "常见用途", v: modelType.usage });
    }

    // 只有当 jsonData 是从 __metadata__ 解析出来时，才用 "元数据 (Info)" 作为 key
    if (jsonData.value && jsonData.value === metaJson) {
       ok.push({ k: "元数据 (Info)", v: jsonData.value }); // 这个 key 会触发 JSON Viewer
    } else if (jsonData.value === meta) { // 如果之前设置了显示整个 meta
       // ok.push({ k: "完整元数据 (JSON)", v: jsonData.value }); // 可以用另一个 key
    }

    modelFileInfoRef.value = ok;

  } catch (error: any) { // 添加类型
      console.error("Error processing model file:", error);
      modelFileInfoRef.value = [{ k: "错误", v: `处理模型文件时发生错误: ${error.message}` }];
  }
}

// 提取标准元数据 (PNG chunks / EXIF)
const extractMetadata = async (file: File): Promise<Array<{ keyword: string; text: string }>> => {
  let results: Array<{ keyword: string; text: string }> = [];
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
      results = chunks
        .filter(chunk => chunk.name === "tEXt" || chunk.name === "iTXt")
        .map(chunk => {
          try {
            return pngChunkText.decode(chunk.data);
          } catch (decodeError) {
              console.warn(`Error decoding ${chunk.name} chunk:`, decodeError);
              return null;
          }
        })
        .filter((entry): entry is { keyword: string; text: string } => entry !== null);
      console.log("PNG Text Chunks found:", results.length);

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
              try {
                 comment = String.fromCodePoint(...data.UserComment.value);
              } catch (fromCodePointError) {
                  console.error("fromCodePoint failed for UserComment:", fromCodePointError);
              }
           }
           comment = comment.replace(/^UNICODE\0*/, '').replace(/^ASCII\0*/, '').replace(/^JIS\0*/, '').replace(/^LATIN1\0*/, '').replace(/\0+$/, '').trim();
           if (comment) {
              console.log("Found parameters in UserComment");
              results.push({ keyword: "parameters", text: comment });
           }
        }
      } catch (exifError: any) { // 添加类型
         // 只记录警告，因为可能没有 EXIF 或 UserComment
         if (!(error.name === 'MetadataMissingError' || error.message?.includes('No EXIF data'))) {
             console.warn("Could not read EXIF data or UserComment:", exifError);
         }
      }
    }
  } catch (error) {
     console.error("Error extracting standard metadata:", error);
  }
  return results;
}

// 读取并解析文件信息（组合标准元数据和隐写术）
async function readFileInfo(file: File): Promise<Array<{ key: string; value: string }>> {
  jsonData.value = null // 重置
  let parsed: Array<{ keyword: string; text: string }> = [];
  let metaSource = "未知来源";
  let metadata: Array<{ keyword: string; text: string }> = [];

  // 1. 尝试标准元数据提取
  try {
      metadata = await extractMetadata(file);
  } catch(extractErr) {
      console.error("Failed to extract standard metadata:", extractErr);
  }

  // 2. 如果标准方法找不到，尝试隐写术
  if (metadata.length === 0) {
    console.log("No standard metadata found, trying stealth exif...");
    if (imageRef.value?.src) {
       try {
         let stealthData = await getStealthExif(imageRef.value.src);
         if (stealthData) {
           console.log("Found stealth exif data.");
           metaSource = "Stealth Exif (隐写术)";
           parsed = Object.entries(stealthData).map(([key, value]) => ({
             keyword: key,
             text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) // 美化 JSON 输出
           }));
           // 标准化 NovelAI 常见关键字
           parsed.forEach(p => {
               if (p.keyword.toLowerCase() === 'description') p.keyword = '提示词 (Description)';
               if (p.keyword.toLowerCase() === 'comment') {
                   p.keyword = '参数 (Comment)'; // 这个通常是 JSON
                   // 尝试解析 Comment JSON 并放入 jsonData
                   try { jsonData.value = JSON.parse(p.text); } catch (e) { console.warn("Could not parse Comment JSON"); }
               }
           });
         } else {
            console.log("No stealth exif data found.");
            metaSource = "无元数据"; // 更新来源状态
         }
       } catch (stealthError) {
           console.error("Error reading stealth exif:", stealthError);
           metaSource = "隐写术读取失败"; // 更新来源状态
       }
    } else {
        console.warn("Image preview not available, cannot try stealth exif.");
        metaSource = "无元数据 (无预览)";
    }
  } else {
     // 3. 处理从标准方法获取的元数据
     metaSource = file.type === "image/png" ? "PNG Chunks" : "EXIF";
     let parametersEntry = metadata.find(m => m.keyword === 'parameters');
     let workflowEntry = metadata.find(m => m.keyword === 'workflow');
     let promptEntry = metadata.find(m => m.keyword === 'prompt');

     if (parametersEntry) { // A1111 WebUI
        console.log("Processing A1111 WebUI style parameters");
        metaSource = "A1111 WebUI";
        parsed = handleWebUiTag(parametersEntry);
     } else if (workflowEntry || promptEntry) { // ComfyUI
        console.log("Processing ComfyUI style parameters");
        metaSource = "ComfyUI";
        if (workflowEntry) {
            parsed.push({ keyword: 'workflow', text: workflowEntry.text });
            try { jsonData.value = JSON.parse(workflowEntry.text); } catch (e) { console.warn("Could not parse workflow JSON"); }
        }
        if (promptEntry) {
             parsed.push({ keyword: 'prompt (JSON)', text: promptEntry.text }); // 假设是 JSON
             // 如果 workflow 没设置 jsonData，用 prompt 试试
             if (!jsonData.value) { try { jsonData.value = JSON.parse(promptEntry.text); } catch (e) { console.warn("Could not parse prompt JSON"); }}
        }
        // 添加其他 metadata 块
        metadata.forEach(m => { if (m !== workflowEntry && m !== promptEntry) parsed.push(m); });
     } else { // 其他情况 (如 NovelAI 的 tEXt)
        console.log("Processing other metadata style");
        parsed = metadata;
        parsed.forEach(p => {
            if (p.keyword.toLowerCase() === 'description') p.keyword = '提示词 (Description)';
            if (p.keyword.toLowerCase() === 'comment') {
                p.keyword = '参数 (Comment)';
                // 尝试解析 Comment JSON
                try { jsonData.value = JSON.parse(p.text); } catch (e) { console.warn("Could not parse Comment JSON"); }
            }
        });
     }
  }

  // 构建最终显示结果
  let ok = [
    { key: "文件名", value: file.name },
    { key: "文件大小", value: prettyBytes(file.size) }, // 使用导入的 prettyBytes
    { key: "推测元数据来源", value: metaSource }
  ];

  if (parsed.length > 0) {
     ok.push(...parsed.map(v => ({
       key: v.keyword,
       value: v.text,
     })));
     // 确保为 JSON Viewer 设置了 jsonData (如果对应 key 存在且之前未设置)
     parsed.forEach(v => {
        if (showJsonViewer(v.keyword) && !jsonData.value) {
            try { jsonData.value = JSON.parse(v.text); } catch (e) {} // 忽略解析错误
        }
     });
  } else if (metaSource === "无元数据" || metaSource === "无元数据 (无预览)") {
    ok.push({
      key: "提示",
      value: "😭 无法读取到有效的图像元数据。图片可能不是由 SD 生成，或已被压缩/编辑。",
    });
  } else if (metaSource === "隐写术读取失败") {
     ok.push({ key: "提示", value: "尝试读取隐藏元数据时出错。" });
  }

  return ok;
}

// 解析 A1111 WebUI "parameters" 字符串
const handleWebUiTag = (data: { keyword: string; text: string }): Array<{ keyword: string; text: string }> => {
  const text = data.text || '';
  let prompts = "";
  let negativePrompt = "";
  let params = "";

  const negPromptMarker = "Negative prompt:";
  const paramsMarker = "Steps:";

  const negPromptIndex = text.indexOf(negPromptMarker);
  const paramsIndex = text.indexOf(paramsMarker);

  if (negPromptIndex !== -1) {
    prompts = text.substring(0, negPromptIndex).trim();
    if (paramsIndex !== -1 && paramsIndex > negPromptIndex) {
      negativePrompt = text.substring(negPromptIndex + negPromptMarker.length, paramsIndex).trim();
      params = text.substring(paramsIndex).trim();
    } else {
      negativePrompt = text.substring(negPromptIndex + negPromptMarker.length).trim();
      params = "";
    }
  } else if (paramsIndex !== -1) {
    prompts = text.substring(0, paramsIndex).trim();
    negativePrompt = "";
    params = text.substring(paramsIndex).trim();
  } else {
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

// 读取图片为 Base64 DataURL
const readImageBase64 = async (file: File) => {
  imageRef.value = null; // 清空旧预览
  try {
     const result = await asyncFileReaderAsDataURL(file);
     const image = new Image();
     image.src = result;
     await new Promise((resolve, reject) => { // 等待图片加载
        image.onload = resolve;
        image.onerror = (e) => reject(new Error("图片加载失败"));
     });
     const { width, height } = image;
     if (width === 0 || height === 0) {
         throw new Error("无法获取图片尺寸，图片可能已损坏或格式不支持。");
     }
     imageRef.value = { width, height, src: result };
  } catch (error: any) { // 添加类型
      console.error("Error reading image as Base64:", error);
      ElMessage.error(`读取图片预览失败: ${error.message}`);
      imageRef.value = null; // 确保失败时 imageRef 是 null
  }
}

// 读取 EXIF 数据
const readExif = async (file: File): Promise<Array<{ key: string; value: any }>> => {
  try {
    const data = await ExifReader.load(file);
    // 过滤并格式化 Key
    const entries = Object.entries(data)
        .filter(([key, value]) => value?.description && String(value.description).trim() !== '')
        .map(([key, value]) => ({
            key: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim(), // 格式化 Key
            value
        }));
    return entries;
  }
  catch (error: any) { // 添加类型
    if (error.name === 'MetadataMissingError' || error.message?.includes('No EXIF data')) {
        console.log("No EXIF metadata found in the image.");
    } else {
        console.warn("Error reading EXIF data:", error);
    }
    return []; // 失败或无数据时返回空数组
  }
}

// --- <script setup> 结束 ---
</script>