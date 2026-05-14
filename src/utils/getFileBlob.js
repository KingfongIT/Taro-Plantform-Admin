import api from '@/plugins/api'

export function getFileBlob(id) {
  return api.get(`/file/${id}`, {
    responseType: 'blob',
  })
}
