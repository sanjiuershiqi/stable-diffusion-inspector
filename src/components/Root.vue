<template>
  <!-- 1. 整体容器 -->
  <div class="text-center px-4 py-8 md:px-6 md:py-12 bg-gray-50 min-h-screen">
    <!-- 2. 最大内容宽度容器 -->
    <div class="max-w-4xl mx-auto"> <!-- Increased max-width slightly -->

      <!-- 3. 标题和描述 -->
      <h1 class="font-bold text-3xl md:text-4xl text-gray-800">Stable Diffusion 法术解析</h1>
      <p class="text-gray-500 my-3 text-base">
        从 Stable Diffusion 生成的图片或模型文件读取元数据
      </p>

      <!-- 4. 元数据统计面板 (可视化增强) -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 my-8">
        <div class="bg-blue-50 p-4 rounded-lg text-center shadow-sm">
          <div class="text-2xl font-bold text-blue-600">{{ modelFileInfoRef?.length || 0 }}</div>
          <div class="text-sm text-blue-500">模型信息条目</div>
        </div>
        <div class="bg-green-50 p-4 rounded-lg text-center shadow-sm">
          <div class="text-2xl font-bold text-green-600">{{ exifRef?.length || 0 }}</div>
          <div class="text-sm text-green-500">EXIF 条目</div>
        </div>
        <div class="bg-purple-50 p-4 rounded-lg text-center shadow-sm col-span-2 md:col-span-1"> <!-- Adjust grid span for responsiveness -->
          <div class="text-2xl font-bold text-purple-600">{{ imgfileInfoRef?.length || 0 }}</div>
          <div class="text-sm text-purple-500">图片元数据字段</div>
        </div>
      </div>

      <!-- 5. 图片预览区域 (性能优化 + 控制功能UI) -->
      <el-card v-if="imgFileRef && imageRef" class="my-8 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg relative overflow-hidden" body-style="padding: 1rem;">
         <!-- Preview Controls UI -->
         <div class="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-lg p-1 md:p-2 shadow-sm z-10">
           <el-tooltip content="显示网格 (待实现)" placement="left">
             <el-switch v-model="previewOptions.showGrid" size="small" class="mr-1 md:mr-2" />
           </el-tooltip>
           <el-button-group size="small">
             <el-tooltip content="缩小" placement="bottom">
               <el-button @click="previewOptions.zoomLevel = Math.max(25, previewOptions.zoomLevel - 25)" :icon="ZoomOut" />
             </el-tooltip>
             <el-button disabled style="min-width: 45px;">{{ previewOptions.zoomLevel }}%</el-button>
              <el-tooltip content="放大" placement="bottom">
               <el-button @click="previewOptions.zoomLevel = Math.min(300, previewOptions.zoomLevel + 25)" :icon="ZoomIn"/>
             </el-tooltip>
           </el-button-group>
         </div>
         <!-- Image - Apply zoom via transform style -->
         <img v-bind="imageRef"
              alt="图片预览"
              class="block mx-auto rounded transition-transform duration-200"
              :style="{ transform: `scale(${previewOptions.zoomLevel / 100})`, maxHeight: '60vh', width: 'auto', height: 'auto', maxWidth: '100%' }" />
         <!-- Grid Overlay (待实现) -->
         <!-- <div v-if="previewOptions.showGrid" class="absolute inset-0 pointer-events-none" style="background-size: 20px 20px; background-image: linear-gradient(to right, grey 1px, transparent 1px), linear-gradient(to bottom, grey 1px, transparent 1px);"></div> -->
      </el-card>

      <!-- 6. 文件上传区域 (视觉增强) -->
      <div class="my-8">
        <el-upload
          class="upload-demo"
          drag
          multiple
          :before-upload="handleUpload"
          accept="image/png, image/jpeg, image/webp, image/avif, .pt, .pth, .ckpt, .safetensors, .bin"
          :class="{ 'border-blue-400 bg-blue-50 ring-2 ring-blue-300 ring-offset-1': isDragover }"
          @dragenter.prevent="isDragover = true"
          @dragover.prevent="isDragover = true"
          @dragleave.prevent="isDragover = false"
          @drop.prevent="isDragover = false"
          >
          <!-- Icon animation conditional on dragover -->
          <el-icon class="el-icon--upload text-4xl text-blue-400" :class="{'animate-bounce': isDragover}"><upload-filled /></el-icon>
          <div class="el-upload__text text-base">
            <span :class="isDragover ? 'text-blue-700 font-semibold' : 'text-gray-700'">拖放文件到此处 或 </span>
            <em class="text-blue-600 font-medium hover:underline">点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip text-gray-500 text-sm mt-2">
              支持 PNG, JPEG, WEBP, AVIF 图片 和 PT, PTH, CKPT, SAFETENSORS, BIN 模型文件
            </div>
          </template>
        </el-upload>
      </div>

      <!-- 7. 信息展示区域 -->
      <!-- 图片信息卡片 (样式优化) -->
      <el-card v-if="imgFileRef && imgfileInfoRef" class="my-8 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg text-left" body-style="padding: 0;">
        <template #header>
          <div class="flex items-center justify-between">
             <h2 class="font-bold text-xl text-gray-800 flex items-center">
                <el-icon class="mr-2 text-blue-500"><InfoFilled /></el-icon>
                图片信息
              </h2>
              <!-- Add clear button? -->
          </div>
        </template>
        <!-- 列表项样式优化 -->
        <div v-for="(item, index) in imgfileInfoRef" :key="item.key + '-img-' + index" class="px-5 py-3 group hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0">
          <div class="flex items-start justify-between">
            <h3 class="font-medium text-sm text-gray-500 flex-shrink-0 mr-4" style="min-width: 120px;">{{ item.key }}</h3>
            <!-- Value and Copy Button -->
            <div class="flex-grow text-right flex items-start justify-end">
               <p class="text-wrap break-all text-sm text-gray-700 leading-relaxed text-left mr-2 font-mono" style="white-space: pre-wrap" v-if="!showJsonViewer(item.key)">
                {{ item.value }}
               </p>
               <json-viewer class="mt-1 text-left flex-grow" :value="jsonData" v-if="jsonData != null && showJsonViewer(item.key)" :expand-depth=4 copyable boxed sort theme="jv-light">
               </json-viewer>
               <el-tooltip content="复制" placement="top" :width="40" v-if="showCopyBtn(item.key)">
                  <el-button class="ml-2 p-0 flex-shrink-0" style="min-height: auto; height: auto; min-width: 20px;" :icon="CopyDocument" text circle @click="copy(item.value)" />
               </el-tooltip>
            </div>
          </div>
        </div>
      </el-card>

      <!-- EXIF 信息卡片 (含搜索功能) -->
      <el-card v-if="imgFileRef && exifRef && exifRef.length > 0" class="my-8 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg text-left" body-style="padding: 0;">
         <template #header>
          <div class="flex items-center justify-between">
             <h2 class="font-bold text-xl text-gray-800 flex items-center">
                <el-icon class="mr-2 text-green-500"><CameraFilled /></el-icon> <!-- Changed Icon -->
                EXIF 元数据
             </h2>
          </div>
        </template>
        <!-- Search Input -->
        <div class="p-4 border-b border-gray-100">
          <el-input
            v-model="searchQuery"
            placeholder="搜索 EXIF 数据..."
            clearable
            :prefix-icon="Search"
          />
        </div>
         <!-- Filtered List -->
         <div v-for="(item, index) in filteredExif" :key="item.key + '-exif-' + index" class="px-5 py-3 group hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0">
           <div class="flex items-start justify-between">
             <h3 class="font-medium text-sm text-gray-500 flex-shrink-0 mr-4" style="min-width: 120px;">{{ item.key }}</h3>
             <p class="flex-grow text-wrap break-all text-sm text-gray-700 leading-relaxed text-left font-mono" style="white-space: pre-wrap">
              {{ item.value.description }}
             </p>
           </div>
         </div>
         <div v-if="filteredExif && filteredExif.length === 0 && searchQuery" class="px-5 py-3 text-center text-gray-500 text-sm">
            未找到匹配项。
         </div>
      </el-card>

       <!-- 模型信息卡片 -->
       <el-card v-if="modelFileRef && modelFileInfoRef" class="my-8 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg text-left" body-style="padding: 0;">
         <template #header>
           <div class="flex items-center justify-between">
             <h2 class="font-bold text-xl text-gray-800 flex items-center">
                <el-icon class="mr-2 text-purple-500"><Cpu /></el-icon> <!-- Changed Icon -->
                模型信息
             </h2>
           </div>
        </template>
         <div v-for="(item, index) in modelFileInfoRef" :key="item.k + '-model-' + index" class="px-5 py-3 group hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0">
           <div class="flex items-start justify-between">
             <h3 class="font-medium text-sm text-gray-500 flex-shrink-0 mr-4" style="min-width: 120px;">
              {{ item.k }}
             </h3>
             <div class="flex-grow text-left">
               <p class="text-wrap break-all text-sm text-gray-700 leading-relaxed font-mono" style="white-space: pre-wrap" v-if="item.k !== '元数据 (Info)' && item.v !== undefined && item.v !== null && !showJsonViewer(item.k)">
                {{ item.v }}
               </p>
               <json-viewer class="mt-1" :value="jsonData" v-if="jsonData != null && showJsonViewer(item.k)" :expand-depth=4 copyable boxed sort theme="jv-light">
               </json-viewer>
             </div>
             <el-tooltip content="复制" placement="top" :width="40" v-if="showCopyBtn(item.k)">
                  <el-button class="ml-2 p-0 flex-shrink-0" style="min-height: auto; height: auto; min-width: 20px;" :icon="CopyDocument" text circle @click="copy(item.v)" />
             </el-tooltip>
           </div>
         </div>
          <!-- 模型用法链接 -->
          <div class="px-5 py-4 text-center bg-gray-50 rounded-b-lg">
             <a class="text-sm text-blue-600 hover:text-blue-700 hover:underline" href="https://www.bilibili.com/read/cv21362202" target="_blank" rel="noopener noreferrer">
               查看常见模型用法详解
             </a>
          </div>
       </el-card>

       <!-- 8. 解析历史记录 (功能增强 - 需要 @vueuse/core) -->
       <el-card v-if="parseHistory && parseHistory.length > 0" class="my-8 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg text-left" body-style="padding: 0;">
          <template #header>
           <div class="flex items-center justify-between">
             <h2 class="font-bold text-xl text-gray-800 flex items-center">
                <el-icon class="mr-2 text-orange-500"><Clock /></el-icon>
                解析历史 (最近 {{ MAX_HISTORY }} 条)
             </h2>
             <el-button text type="danger" size="small" @click="clearHistory" :icon="Delete">清空历史</el-button>
           </div>
          </template>
          <el-timeline class="p-5">
            <el-timeline-item
              v-for="item in parseHistory"
              :key="item.id"
              :timestamp="formatTimestamp(item.timestamp)"
              placement="top"
              :hollow="true"
            >
              <p class="text-sm font-medium text-gray-700">{{ item.name }}</p>
              <p class="text-xs text-gray-500">{{ item.type }}</p>
              <!-- Add button to reload/re-inspect? -->
            </el-timeline-item>
          </el-timeline>
       </el-card>


      <!-- 9. 页脚信息 -->
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
/* JSON Viewer Styles */
.jv-container.boxed {
  border-radius: 6px;
  border: 1px solid #eee;
}
.jv-container .jv-code {
  padding: 10px 15px !important;
}
/* Light theme for JSON Viewer */
.jv-light {
    background: #fff !important;
    white-space: pre-wrap !important;
    color: #587850 !important; /* Default text color */

    .jv-ellipsis {
        color: #999 !important;
        background-color: #eee !important;
        display: inline-block;
        line-height: 0.9;
        font-size: 0.9em;
        padding: 0px 4px 2px 4px;
        margin: 0 4px;
        border-radius: 3px;
        cursor: pointer;
        user-select: none;
    }
    .jv-button { color: #49b3ff !important; }
    .jv-key { color: #92278f !important; /* Changed key color */ } /* Key color purple */
    .jv-item {
        &.jv-array { color: #3a9bcd !important; } /* Array color blue */
        &.jv-boolean { color: #f98280 !important; } /* Boolean color red */
        &.jv-function { color: #067bca !important; }
        &.jv-number { color: #2db7f5 !important; } /* Number color light blue */
        &.jv-number-float { color: #2db7f5 !important; }
        &.jv-number-integer { color: #2db7f5 !important; }
        &.jv-object { color: #2f495e !important; } /* Object color dark grey */
        &.jv-undefined { color: #e08331 !important; } /* Undefined color orange */
        &.jv-string {
            color: #42b983 !important; /* String color green */
            word-break: break-word !important;
            white-space: normal !important;
        }
    }
    .jv-code .jv-toggle {
        &:before { padding: 0px 2px; border-radius: 2px; }
        &:hover { &:before { background: #eee; } }
    }
}

/* Element Plus Card Header */
.el-card__header {
  padding: 0.8rem 1.25rem;
  border-bottom: 1px solid #f0f0f0; /* Slightly darker border */
  background-color: #fafafa; /* Light grey header background */
}

/* Element Plus Upload Dragger */
.el-upload-dragger {
  border: 2px dashed #dcdfe6;
  transition: border-color 0.3s, background-color 0.3s;
  background-color: #fff;
  border-radius: 8px; /* More rounded */
  padding: 30px; /* Increase padding */
}
.upload-demo:hover .el-upload-dragger { /* Apply hover to parent for better control */
  border-color: #409EFF;
}
.el-upload-dragger.is-dragover, /* Class added by Element Plus on dragover */
.upload-demo.border-blue-400 .el-upload-dragger /* Use our custom class */
{
  background-color: #f0f8ff !important; /* Lighter blue background on dragover */
  border-color: #409EFF !important;
  border-style: solid;
}

/* Timeline adjustment */
.el-timeline {
    padding-left: 10px; /* Reduce default padding */
}
.el-timeline-item__timestamp {
    font-size: 0.75rem; /* Smaller timestamp */
}
</style>

<script setup lang="ts">
// --- Vue & Core Libs ---
import { ref, reactive, computed, onBeforeUnmount } from 'vue';

// --- External Libs ---
import { ElMessage, ElMessageBox } from "element-plus"; // Import ElMessageBox
import ExifReader from "exifreader";
import prettyBytes from "pretty-bytes";
import extractChunks from "png-chunks-extract";
import * as pngChunkText from "png-chunk-text";
// @ts-ignore
import jsonViewer from "vue-json-viewer/ssr"; // Try SSR import
import { UploadFilled, CopyDocument, InfoFilled, CameraFilled, Cpu, ZoomIn, ZoomOut, Search, Clock, Delete } from "@element-plus/icons-vue"; // Import new icons
import useClipboard from "vue-clipboard3";
import { useStorage } from '@vueuse/core'; // <-- Required for History

// --- Local Imports ---
import modelsig from '../assets/modelsig.json';
import { asyncFileReaderAsDataURL, getStealthExif, getSafetensorsMeta, getSafetensorsMetaKohya, readFileInChunks } from "../utils"; // Assume readFileInChunks is in utils

// --- Constants ---
const MAX_HISTORY = 10; // Increased history limit
const commitHash = import.meta.env.VITE_COMMIT_HASH || "unknown";
const availableImgExt = ["png", "jpeg", "jpg", "webp", "bmp", "avif"];
const availableModelExt = ["pt", "pth", "ckpt", "safetensors", "bin"];

// --- Reactive State ---
const isDragover = ref(false); // For upload area visual feedback

// Image/Model specific state
const imgFileRef = ref<File | null>(null);
const imageRef = ref<{ width: number; height: number; src: string } | null>(null); // src will be Object URL
const exifRef = ref<Array<{ key: string; value: any }> | null>(null);
const imgfileInfoRef = ref<Array<{ key: string; value: string }> | null>(null);
const modelFileRef = ref<File | null>(null);
const modelFileInfoRef = ref<Array<{ k: string; v: any }> | null>(null);
const jsonData = ref<any>(null); // For json-viewer

// UI Control State
const previewOptions = reactive({
  showGrid: false, // Grid display not implemented yet
  zoomLevel: 100,
});
const searchQuery = ref(''); // For EXIF search

// History State (Requires @vueuse/core)
interface HistoryItem {
    id: number;
    name: string;
    type?: string; // Optional type
    timestamp: string;
    // Storing full meta can be large, consider storing only key info or a summary
    // meta: string; // Storing stringified meta
    previewSrc?: string; // Store Object URL for preview if possible? Needs management.
}
const parseHistory = useStorage<HistoryItem[]>('sd-parser-history', []);

// --- Computed Properties ---
const filteredExif = computed(() => {
  if (!exifRef.value) return [];
  if (!searchQuery.value) return exifRef.value;
  const query = searchQuery.value.toLowerCase();
  return exifRef.value.filter(item =>
    item.key.toLowerCase().includes(query) ||
    String(item.value?.description ?? '').toLowerCase().includes(query) // Check description safely
  );
});

// --- Methods ---

// Clipboard Copy
const copy = async (value: any) => {
  try {
    const textToCopy = (typeof value === 'object' && value !== null) ? JSON.stringify(value, null, 2) : String(value ?? '');
    await toClipboard(textToCopy);
    ElMessage.success({ message: "复制成功", duration: 1500 });
  } catch (e) {
    console.error("复制失败:", e);
    ElMessage.warning({ message: "复制失败", duration: 1500 });
  }
};

// Conditional Rendering Logic
const showCopyBtn = (title: string): boolean => {
  if (!title) return false;
  const copyableKeys = ["Description", "Comment", "完整生成信息", "提示词", "负面提示词", "其他参数", "parameters", "workflow", "prompt (JSON)", "prompt (原始文本)", "workflow (原始文本)", "参数 (Comment)"];
  return copyableKeys.some(key => title.startsWith(key));
};

const showJsonViewer = (title: string): boolean => {
  if (!title) return false;
  const jsonKeys = ["Comment", "workflow", "Info", "元数据 (Info)", "prompt (JSON)", "参数 (Comment)"];
  return jsonKeys.some(key => title.startsWith(key));
};

// Data Cleaning
const cleanData = () => {
  if (imageRef.value?.src && imageRef.value.src.startsWith('blob:')) {
      URL.revokeObjectURL(imageRef.value.src); // Revoke previous Object URL if exists
      console.log("Revoked previous Object URL:", imageRef.value.src);
  }
  imgFileRef.value = null;
  modelFileRef.value = null;
  imgfileInfoRef.value = null;
  modelFileInfoRef.value = null;
  exifRef.value = null;
  jsonData.value = null;
  imageRef.value = null;
  searchQuery.value = ''; // Clear search query
  previewOptions.zoomLevel = 100; // Reset zoom
};

// History Management
const addToHistory = (file: File, infoRefValue: Array<any> | null) => {
  if (!file || !infoRefValue) return; // Basic check

  // Create a summary or select key info instead of storing everything
   const summary = infoRefValue.find(item => item.key === '提示词')?.value ?? infoRefValue.find(item => item.key === '推测模型种类')?.v ?? '元数据';
   // const metaSummary = JSON.stringify({ summary: summary, size: file.size }); // Example summary

  const newItem: HistoryItem = {
    id: Date.now(),
    name: file.name,
    type: file.type,
    timestamp: new Date().toISOString(),
    // meta: metaSummary, // Store summary instead of full data
    previewSrc: imageRef.value?.src // Store current Object URL (might be revoked later!) - Needs careful handling
  };

  // Add to the beginning and trim
  const newHistory = [newItem, ...parseHistory.value];
  parseHistory.value = newHistory.slice(0, MAX_HISTORY);
  console.log("Added to history:", newItem.name);
};

const clearHistory = () => {
    ElMessageBox.confirm(
        '确定要清空所有解析历史记录吗？此操作不可撤销。',
        '清空历史',
        {
            confirmButtonText: '确定清空',
            cancelButtonText: '取消',
            type: 'warning',
        }
    ).then(() => {
        parseHistory.value = [];
        ElMessage.success('历史记录已清空');
    }).catch(() => {
        ElMessage.info('已取消清空操作');
    });
};

// Timestamp Formatting (for History)
const formatTimestamp = (isoString: string) => {
    try {
        const date = new Date(isoString);
        return date.toLocaleString(); // Use locale-specific format
    } catch (e) {
        return isoString; // Fallback
    }
};

// File Upload Handler
async function handleUpload(file: File) {
  console.log("Handling upload:", file.name, file.type, file.size);
  isDragover.value = false; // Ensure dragover state is reset
  cleanData(); // Clean previous data

  const fileExt = file.name?.split(".").pop()?.toLowerCase() ?? '';

  if (!fileExt || !file.size) {
     ElMessage.error("无效的文件或无法识别的文件类型");
     return false;
  }

  // --- Start Processing ---
  ElMessage.info(`开始解析文件: ${file.name}`); // Give feedback

  if (availableModelExt.includes(fileExt)) {
    modelFileRef.value = file;
    try {
      await inspectModel(file);
      addToHistory(file, modelFileInfoRef.value); // Add to history on success
    } catch (error: any) {
       console.error("Error inspecting model:", error);
       ElMessage.error(`解析模型文件时出错: ${error.message}`);
       modelFileInfoRef.value = null; jsonData.value = null;
    }
  } else if (availableImgExt.includes(fileExt)) {
    imgFileRef.value = file;
    try {
       await inspectImage(file);
       addToHistory(file, imgfileInfoRef.value); // Add to history on success
    } catch (error: any) {
       console.error("Error inspecting image:", error);
       ElMessage.error(`解析图片文件时出错: ${error.message}`);
       imgfileInfoRef.value = null; exifRef.value = null; jsonData.value = null; imageRef.value = null;
    }
  } else {
    ElMessage.warning("不支持的文件类型，请选择图片或模型文件。");
  }
  return false; // Prevent default upload
}

// Image Inspection Logic
const inspectImage = async (file: File) => {
  try {
    // 1. Read image for preview (uses Object URL now)
    await readImageBase64(file);
    if (!imageRef.value) throw new Error("无法加载图片预览");

    // 2. Parallel EXIF and File Info (Metadata + Stealth)
    const [exifData, fileInfo] = await Promise.all([
        readExif(file),
        readFileInfo(file) // Depends on imageRef for stealth check
    ]);
    exifRef.value = exifData;
    imgfileInfoRef.value = fileInfo;
    ElMessage.success("图片信息解析完成");

  } catch (error: any) {
     console.error("Error during image inspection:", error);
     // Let handleUpload catch and display the error message
     throw error; // Rethrow to be caught by handleUpload
  }
}

// Model Inspection Logic (Uses readFileInChunks)
const inspectModel = async (file: File) => {
  const modelTypes = modelsig.data;
  const fileSize = file.size;
  const fileExt = file.name.split(".").pop()?.toLowerCase() ?? '';

  if (!fileSize || fileSize < 1024) {
    modelFileInfoRef.value = [{ k: "错误", v: "🤔 文件过小或无效。" }];
    return;
  }

  let modelType: { name: string; identifier: string; usage: string; sigs: string[]; } | null = null;
  const knownIdentifier = modelTypes.map(x => x.identifier);
  let modelKeysContent = "";
  let meta = null;
  let metaJson = null;
  jsonData.value = null;

  try {
    if (fileExt === "safetensors") {
      try {
        meta = await getSafetensorsMeta(file);
        if (meta && meta["__metadata__"]) {
           metaJson = await getSafetensorsMetaKohya(file);
           jsonData.value = metaJson;
        }
        const modelKeys = Object.keys(meta ?? {}).filter(key => key !== "__metadata__");
        modelKeysContent = modelKeys.join("\n"); // Still needed for signature check? Maybe not if meta has architecture
      } catch (e: any) {
        console.error("Failed to parse Safetensors metadata:", e);
        throw new Error(`解析 Safetensors 元数据失败: ${e.message}`); // Rethrow
      }
    } else {
       try {
         // Use chunked reading for non-safetensors model head
         modelKeysContent = await readFileInChunks(file, 1024 * 100); // Read up to 100KB head in chunks
         console.log("[debug] Read model file head sample via chunks: " + modelKeysContent.substring(0, 500));
       } catch (readError: any) {
          console.error("Error reading model file head:", readError);
          throw new Error(`读取模型文件头部失败: ${readError.message}`); // Rethrow
       }
    }

    // Model type detection (same logic as before)
    if (metaJson?.["modelspec.architecture"] && knownIdentifier.includes(metaJson["modelspec.architecture"])) {
       modelType = modelTypes.find(x => x.identifier === metaJson["modelspec.architecture"]) ?? null;
    } else if (meta?.["modelspec.architecture"] && knownIdentifier.includes(meta["modelspec.architecture"])) {
       modelType = modelTypes.find(x => x.identifier === meta["modelspec.architecture"]) ?? null;
    } else if (modelKeysContent) { // Only use signature if no architecture found or not safetensors
      for (let m of modelTypes) {
        if (modelType) break;
        for (let sig of m.sigs) { if (modelKeysContent.includes(sig)) { modelType = m; break; } }
      }
    }

    const modelTypeOk = modelType?.name ?? "😭 未知种类或非模型";
    let ok = [
      { k: "文件名", v: file.name },
      { k: "文件大小", v: prettyBytes(fileSize) },
      { k: "推测模型种类", v: modelTypeOk },
    ];
    if (modelType) ok.push({ k: "常见用途", v: modelType.usage });
    if (jsonData.value && jsonData.value === metaJson) ok.push({ k: "元数据 (Info)", v: jsonData.value });

    modelFileInfoRef.value = ok;
    ElMessage.success("模型信息解析完成");

  } catch (error: any) {
      console.error("Error processing model file:", error);
      // Let handleUpload catch and display the error message
      throw error; // Rethrow
  }
}

// Extract Standard Metadata
const extractMetadata = async (file: File): Promise<Array<{ keyword: string; text: string }>> => {
  // ... (Keep the improved logic from the previous version) ...
  let results: Array<{ keyword: string; text: string }> = [];
  try {
    if (file.type === "image/png") {
      const buf = await file.arrayBuffer();
      let chunks = [];
      try { chunks = extractChunks(new Uint8Array(buf)); } catch (err) { console.warn("Extract PNG chunks error:", err); return []; }
      results = chunks
        .filter(chunk => chunk.name === "tEXt" || chunk.name === "iTXt")
        .map(chunk => { try { return pngChunkText.decode(chunk.data); } catch (e) { console.warn(`Decode ${chunk.name} error:`, e); return null; }})
        .filter((e): e is { keyword: string; text: string } => e !== null);
    } else if (["image/webp", "image/jpeg", "image/avif"].includes(file.type)) {
      try {
        const data = await ExifReader.load(file);
        if (data.UserComment?.value) {
           let comment = "";
           try { comment = new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(data.UserComment.value)); }
           catch (e) { try { comment = String.fromCodePoint(...data.UserComment.value); } catch (e2) { console.error("Decode UserComment failed:", e2); } }
           comment = comment.replace(/^UNICODE\0*/, '').replace(/^ASCII\0*/, '').replace(/^JIS\0*/, '').replace(/^LATIN1\0*/, '').replace(/\0+$/, '').trim();
           if (comment) results.push({ keyword: "parameters", text: comment });
        }
      } catch (exifError: any) { if (!(exifError.name === 'MetadataMissingError' || exifError.message?.includes('No EXIF data'))) console.warn("Read EXIF error:", exifError); }
    }
  } catch (error) { console.error("Extract metadata error:", error); }
  return results;
}

// Read and Parse File Info (Metadata + Stealth)
async function readFileInfo(file: File): Promise<Array<{ key: string; value: string }>> {
  jsonData.value = null;
  let parsed: Array<{ keyword: string; text: string }> = [];
  let metaSource = "未知来源";
  let metadata: Array<{ keyword: string; text: string }> = [];

  try { metadata = await extractMetadata(file); } catch(e) { console.error("Extract metadata failed:", e); }

  if (metadata.length === 0) {
    console.log("No standard metadata, trying stealth...");
    if (imageRef.value?.src) {
       try {
         let stealthData = await getStealthExif(imageRef.value.src);
         if (stealthData) {
           console.log("Found stealth data."); metaSource = "Stealth Exif";
           parsed = Object.entries(stealthData).map(([k, v]) => ({ keyword: k, text: typeof v === 'string' ? v : JSON.stringify(v, null, 2) }));
           parsed.forEach(p => { if (p.keyword.toLowerCase() === 'description') p.keyword = '提示词 (Description)'; if (p.keyword.toLowerCase() === 'comment') { p.keyword = '参数 (Comment)'; try { jsonData.value = JSON.parse(p.text); } catch (e) {} } });
         } else { console.log("No stealth data."); metaSource = "无元数据"; }
       } catch (stealthError) { console.error("Read stealth error:", stealthError); metaSource = "隐写术读取失败"; }
    } else { console.warn("No preview for stealth check."); metaSource = "无元数据(无预览)"; }
  } else { // Process standard metadata
     metaSource = file.type === "image/png" ? "PNG Chunks" : "EXIF";
     let parametersEntry = metadata.find(m => m.keyword === 'parameters');
     let workflowEntry = metadata.find(m => m.keyword === 'workflow');
     let promptEntry = metadata.find(m => m.keyword === 'prompt');
     if (parametersEntry) { metaSource = "A1111 WebUI"; parsed = handleWebUiTag(parametersEntry); }
     else if (workflowEntry || promptEntry) {
        metaSource = "ComfyUI";
        if (workflowEntry) { parsed.push({ keyword: 'workflow', text: workflowEntry.text }); try { jsonData.value = JSON.parse(workflowEntry.text); } catch (e) {} }
        if (promptEntry) { parsed.push({ keyword: 'prompt (JSON)', text: promptEntry.text }); if (!jsonData.value) try { jsonData.value = JSON.parse(promptEntry.text); } catch (e) {} }
        metadata.forEach(m => { if (m !== workflowEntry && m !== promptEntry) parsed.push(m); });
     } else {
        parsed = metadata;
        parsed.forEach(p => { if (p.keyword.toLowerCase() === 'description') p.keyword = '提示词 (Description)'; if (p.keyword.toLowerCase() === 'comment') { p.keyword = '参数 (Comment)'; try { jsonData.value = JSON.parse(p.text); } catch (e) {} } });
     }
  }

  let ok = [ { key: "文件名", value: file.name }, { key: "文件大小", value: prettyBytes(file.size) }, { key: "推测元数据来源", value: metaSource }];
  if (parsed.length > 0) {
     ok.push(...parsed.map(v => ({ key: v.keyword, value: v.text })));
     parsed.forEach(v => { if (showJsonViewer(v.keyword) && !jsonData.value) { try { jsonData.value = JSON.parse(v.text); } catch (e) {} } });
  } else if (metaSource.startsWith("无元数据")) { ok.push({ key: "提示", value: "😭 未找到有效元数据。" }); }
  else if (metaSource === "隐写术读取失败") { ok.push({ key: "提示", value: "读取隐藏元数据出错。" }); }
  return ok;
}

// Parse A1111 WebUI Parameters String
const handleWebUiTag = (data: { keyword: string; text: string }): Array<{ keyword: string; text: string }> => {
  // ... (Keep improved logic from previous version) ...
   const text = data.text || '';
   const negPromptMarker = "Negative prompt:";
   const paramsMarker = "Steps:";
   const negPromptIndex = text.indexOf(negPromptMarker);
   const paramsIndex = text.indexOf(paramsMarker);
   let prompts = "", negativePrompt = "", params = "";

   if (negPromptIndex !== -1) {
       prompts = text.substring(0, negPromptIndex).trim();
       if (paramsIndex !== -1 && paramsIndex > negPromptIndex) {
           negativePrompt = text.substring(negPromptIndex + negPromptMarker.length, paramsIndex).trim();
           params = text.substring(paramsIndex).trim();
       } else { negativePrompt = text.substring(negPromptIndex + negPromptMarker.length).trim(); }
   } else if (paramsIndex !== -1) {
       prompts = text.substring(0, paramsIndex).trim();
       params = text.substring(paramsIndex).trim();
   } else { prompts = text.trim(); }

   return [ { keyword: "提示词", text: prompts || "无" }, { keyword: "负面提示词", text: negativePrompt || "无" }, { keyword: "其他参数", text: params || "无" }];
}

// Read Image as Object URL
const readImageBase64 = async (file: File) => { // Renamed, but still uses Object URL
  if (imageRef.value?.src && imageRef.value.src.startsWith('blob:')) {
      URL.revokeObjectURL(imageRef.value.src); // Revoke previous one
  }
  imageRef.value = null;
  let objectURL = "";
  try {
     objectURL = URL.createObjectURL(file);
     console.log("Created Object URL:", objectURL);
     const image = new Image();
     image.src = objectURL;
     await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = (e) => reject(new Error("图片加载失败"));
     });
     const { width, height } = image;
     if (width === 0 || height === 0) {
         throw new Error("无法获取图片尺寸");
     }
     imageRef.value = { width, height, src: objectURL }; // Assign Object URL to src
  } catch (error: any) {
      console.error("Error reading image preview:", error);
      ElMessage.error(`读取图片预览失败: ${error.message}`);
      if (objectURL) URL.revokeObjectURL(objectURL); // Clean up if error occurred after creation
      imageRef.value = null;
      throw error; // Rethrow so inspectImage knows preview failed
  }
}

// Read EXIF Data
const readExif = async (file: File): Promise<Array<{ key: string; value: any }>> => {
  try {
    const data = await ExifReader.load(file);
    const entries = Object.entries(data)
        .filter(([key, value]) => value?.description && String(value.description).trim() !== '')
        .map(([key, value]) => ({ key: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim(), value }));
    return entries;
  }
  catch (error: any) {
    if (error.name === 'MetadataMissingError' || error.message?.includes('No EXIF data')) { console.log("No EXIF data found."); }
    else { console.warn("Error reading EXIF data:", error); }
    return [];
  }
}

// --- Lifecycle Hooks ---
onBeforeUnmount(() => {
  // Revoke Object URL when component unmounts
  if (imageRef.value?.src && imageRef.value.src.startsWith('blob:')) {
    console.log("Revoking Object URL on unmount:", imageRef.value.src);
    URL.revokeObjectURL(imageRef.value.src);
  }
  // Note: Object URLs stored in history might become invalid if the component unmounts
  // A more robust history would need to store Base64 or re-read the file.
});

</script>