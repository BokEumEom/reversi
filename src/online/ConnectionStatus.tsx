import { useTranslation } from 'react-i18next'
import type { ConnectionStatus as ConnectionStatusType } from './types'

interface ConnectionStatusProps {
  readonly status: ConnectionStatusType
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const { t } = useTranslation()

  const statusConfig = {
    connected: { color: 'bg-emerald-500', text: t('online.connected') },
    connecting: { color: 'bg-yellow-500 animate-pulse', text: t('online.connecting') },
    disconnected: { color: 'bg-red-500', text: t('online.disconnected') },
    reconnecting: { color: 'bg-yellow-500 animate-pulse', text: t('online.reconnecting') },
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
      <span className="text-neutral-500">{config.text}</span>
    </div>
  )
}
