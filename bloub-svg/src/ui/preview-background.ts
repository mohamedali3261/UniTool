import { ref, watch } from 'vue'
import { ecris, lis } from './stockage'

export const fondApercu = ref(lis('previewBackground') ?? 'transparent')

watch(fondApercu, (value) => ecris('previewBackground', value))
