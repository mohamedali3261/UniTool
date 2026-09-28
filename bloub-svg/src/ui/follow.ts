import { ref } from 'vue'
import { ecris, lis } from './stockage'

export const suitPointeur = ref(lis('follow') !== 'false')

export function changeSuivi(active: boolean) {
  suitPointeur.value = active
  ecris('follow', String(active))
}
