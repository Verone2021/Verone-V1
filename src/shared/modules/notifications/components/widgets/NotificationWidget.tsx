"use client"

import { useState, useEffect } from 'react'
import { X, Bell, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type NotificationType = 'success' | 'warning' | 'error' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  dismissed?: boolean
  autoClose?: boolean
  duration?: number // en millisecondes
  action?: {
    label: string
    handler: () => void
  }
}

interface NotificationWidgetProps {
  notifications: Notification[]
  onDismiss: (id: string) => void
  maxVisible?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  className?: string
}

const typeConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    badgeColor: 'border-green-300 text-green-600'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    iconColor: 'text-black',
    badgeColor: 'border-gray-300 text-black'
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    badgeColor: 'border-red-300 text-red-600'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    badgeColor: 'border-blue-300 text-blue-600'
  }
}

const positionStyles = {
  'top-right': 'fixed top-4 right-4 z-50',
  'top-left': 'fixed top-4 left-4 z-50',
  'bottom-right': 'fixed bottom-4 right-4 z-50',
  'bottom-left': 'fixed bottom-4 left-4 z-50'
}

export function NotificationWidget({
  notifications,
  onDismiss,
  maxVisible = 5,
  position = 'top-right',
  className
}: NotificationWidgetProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const activeNotifications = notifications
      .filter(n => !n.dismissed)
      .slice(0, maxVisible)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    setVisibleNotifications(activeNotifications)

    // Gestion de l'auto-close
    activeNotifications.forEach(notification => {
      if (notification.autoClose !== false) {
        const duration = notification.duration || 5000
        setTimeout(() => {
          onDismiss(notification.id)
        }, duration)
      }
    })
  }, [notifications, maxVisible, onDismiss])

  if (visibleNotifications.length === 0) {
    return null
  }

  return (
    <div className={cn(positionStyles[position], className)}>
      <div className="space-y-3 w-80">
        {visibleNotifications.map((notification) => {
          const config = typeConfig[notification.type]
          const Icon = config.icon

          return (
            <Card
              key={notification.id}
              className={cn(
                config.bgColor,
                config.borderColor,
                'border-l-4 shadow-lg animate-in slide-in-from-right duration-300'
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className={cn('h-4 w-4', config.iconColor)} />
                    <CardTitle className="text-sm font-medium text-black">
                      {notification.title}
                    </CardTitle>
                    <Badge variant="outline" className={cn('text-xs', config.badgeColor)}>
                      {notification.type}
                    </Badge>
                  </div>
                  <ButtonV2
                    variant="ghost"
                    size="sm"
                    onClick={() => onDismiss(notification.id)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </ButtonV2>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-700 mb-2">
                  {notification.message}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(notification.timestamp).toLocaleTimeString('fr-FR')}
                  </span>

                  {notification.action && (
                    <ButtonV2
                      variant="outline"
                      size="sm"
                      onClick={notification.action.handler}
                      className="h-6 text-xs border-black text-black hover:bg-black hover:text-white"
                    >
                      {notification.action.label}
                    </ButtonV2>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// Hook pour gérer les notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    }

    setNotifications(prev => [newNotification, ...prev])

    return newNotification.id
  }

  const dismissNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, dismissed: true } : n)
    )
  }

  const clearAll = () => {
    setNotifications([])
  }

  // Helper methods pour les différents types
  const success = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'success', title, message, ...options })
  }

  const warning = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'warning', title, message, ...options })
  }

  const error = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'error', title, message, autoClose: false, ...options })
  }

  const info = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'info', title, message, ...options })
  }

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAll,
    success,
    warning,
    error,
    info
  }
}

// Composant de notification toast simple
export function NotificationToast({
  type,
  title,
  message,
  onClose,
  duration = 5000
}: {
  type: NotificationType
  title: string
  message: string
  onClose: () => void
  duration?: number
}) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div className={cn(
      'flex items-start p-4 rounded-lg shadow-lg max-w-sm',
      config.bgColor,
      config.borderColor,
      'border-l-4 animate-in slide-in-from-right duration-300'
    )}>
      <Icon className={cn('h-5 w-5 mr-3 mt-0.5', config.iconColor)} />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-black mb-1">
          {title}
        </h4>
        <p className="text-sm text-gray-700">
          {message}
        </p>
      </div>
      <ButtonV2
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="ml-2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </ButtonV2>
    </div>
  )
}