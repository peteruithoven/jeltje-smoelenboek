<script setup lang="ts">
import { CircleStencil, Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

const model = defineModel<PhotoState>({ required: true })
defineProps<{ invalid?: boolean }>()

interface CropperInstance {
  getResult: () => { coordinates: Crop; canvas?: HTMLCanvasElement }
  zoom: (factor: number) => void
  setCoordinates: (coordinates: Partial<Crop>) => void
}

const editing = ref<{ src: string; crop: Crop | null } | null>(null)
const busy = ref(false)
const error = ref('')
const cropper = useTemplateRef<CropperInstance>('cropper')
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

function chooseFile() {
  fileInput.value?.click()
}

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  error.value = ''
  busy.value = true
  try {
    editing.value = { src: await fileToJpeg(file), crop: null }
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    busy.value = false
  }
}

function adjust() {
  if (model.value.original) editing.value = { src: model.value.original, crop: model.value.crop }
}

async function rotate() {
  if (!editing.value) return
  busy.value = true
  try {
    editing.value = { src: await rotateJpeg(await urlToDataUrl(editing.value.src)), crop: null }
  } finally {
    busy.value = false
  }
}

function zoom(factor: number) {
  cropper.value?.zoom(factor)
}

// Vaste, ronde uitsnede in het midden; je verschuift en zoomt de foto eronder.
function stencilSize({ boundaries }: { boundaries: { width: number; height: number } }) {
  const size = Math.min(boundaries.width, boundaries.height) - 32
  return { width: size, height: size }
}

// Begin uitgezoomd: de cirkel past precies op de korte kant van de foto
function defaultSize({ imageSize }: { imageSize: { width: number; height: number } }) {
  const size = Math.min(imageSize.width, imageSize.height)
  return { width: size, height: size }
}

function onReady() {
  // Herstel een eerder gekozen uitsnede
  const crop = editing.value?.crop
  if (crop) cropper.value?.setCoordinates(crop)
}

function confirm() {
  if (!cropper.value || !editing.value) return
  const { coordinates, canvas } = cropper.value.getResult()
  if (!canvas) return
  const photo = canvasToSquareJpeg(canvas)
  model.value = {
    original: editing.value.src,
    crop: { ...coordinates },
    preview: photo,
    photo,
  }
  editing.value = null
}

function cancel() {
  editing.value = null
}
</script>

<template>
  <div>
    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFile" />

    <!-- Uitsnede kiezen -->
    <div v-if="editing" class="overflow-hidden border-2 border-ink bg-ink">
      <Cropper
        ref="cropper"
        class="h-[min(65vh,400px)] w-full"
        :src="editing.src"
        :stencil-component="CircleStencil"
        :stencil-props="{ handlers: {}, movable: false, resizable: false, aspectRatio: 1 }"
        :stencil-size="stencilSize"
        :default-size="defaultSize"
        image-restriction="stencil"
        background-class="!bg-ink"
        @ready="onReady"
      />
      <p class="px-3 pt-3 text-center text-sm text-white/80">
        Sleep de foto en zoom in of uit zodat je gezicht mooi in de cirkel past.
      </p>
      <div class="flex flex-wrap items-center justify-center gap-2 p-3">
        <button
          type="button"
          class="btn min-h-10 bg-white/10 px-3 text-white hover:bg-white/20"
          aria-label="Uitzoomen"
          @click="zoom(0.8)"
        >
          <svg
            viewBox="0 0 24 24"
            class="size-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5M8 11h6" />
          </svg>
        </button>
        <button
          type="button"
          class="btn min-h-10 bg-white/10 px-3 text-white hover:bg-white/20"
          aria-label="Inzoomen"
          @click="zoom(1.25)"
        >
          <svg
            viewBox="0 0 24 24"
            class="size-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5M8 11h6M11 8v6" />
          </svg>
        </button>
        <button
          type="button"
          class="btn min-h-10 bg-white/10 px-3 text-white hover:bg-white/20"
          aria-label="Draai een kwartslag"
          :disabled="busy"
          @click="rotate"
        >
          <svg
            viewBox="0 0 24 24"
            class="size-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 11a8 8 0 1 0-2.3 5.7" />
            <path d="M20 4v7h-7" />
          </svg>
        </button>
        <span class="mx-1 hidden h-6 w-px bg-white/20 sm:block" />
        <button
          type="button"
          class="btn min-h-10 px-4 text-white/80 hover:text-white"
          @click="cancel"
        >
          Annuleren
        </button>
        <button type="button" class="btn-primary min-h-10" @click="confirm">
          Gebruik deze foto
        </button>
      </div>
    </div>

    <!-- Gekozen foto -->
    <div v-else-if="model.preview" class="flex items-center gap-4">
      <img
        :src="model.preview"
        alt="Jouw foto"
        class="size-24 shrink-0 rounded-full bg-paper object-cover"
      />
      <div class="flex flex-col items-start gap-1">
        <button
          v-if="model.original"
          type="button"
          class="btn-secondary min-h-10 px-4 text-sm"
          @click="adjust"
        >
          Uitsnede aanpassen
        </button>
        <button type="button" class="btn-ghost min-h-10 text-sm" @click="chooseFile">
          Andere foto kiezen
        </button>
      </div>
    </div>

    <!-- Nog geen foto -->
    <button
      v-else
      type="button"
      class="flex w-full cursor-pointer flex-col items-center gap-2 border-2 border-dashed px-4 py-8 text-center transition hover:border-blue-dark hover:bg-blue/5"
      :class="invalid ? 'border-red bg-red/5' : 'border-line'"
      :disabled="busy"
      @click="chooseFile"
    >
      <svg
        viewBox="0 0 24 24"
        class="size-10 text-blue-dark"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
        <circle cx="12" cy="13" r="3.5" />
      </svg>
      <span class="font-display text-xl">{{ busy ? 'Foto laden…' : 'Kies of maak een foto' }}</span>
      <span class="text-sm text-muted"
        >Het liefst een vrolijke foto waarop je gezicht goed te zien is.</span
      >
    </button>

    <p v-if="error" class="mt-2 text-sm text-red-dark">{{ error }}</p>
  </div>
</template>
