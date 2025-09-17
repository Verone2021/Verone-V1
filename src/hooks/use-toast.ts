'use client'

import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

interface ToastState {
  toasts: Toast[]
}

let toastCounter = 0

const defaultToasts: ToastState = {
  toasts: []
}

let globalState = defaultToasts
let listeners: Array<(state: ToastState) => void> = []

function dispatch(action: { type: string; payload?: any }) {
  switch (action.type) {
    case 'ADD_TOAST':
      globalState = {
        ...globalState,
        toasts: [...globalState.toasts, action.payload]
      }
      break
    case 'REMOVE_TOAST':
      globalState = {
        ...globalState,
        toasts: globalState.toasts.filter(toast => toast.id !== action.payload)
      }
      break
    case 'CLEAR_TOASTS':
      globalState = {
        ...globalState,
        toasts: []
      }
      break
  }

  listeners.forEach(listener => listener(globalState))
}

export function useToast() {
  const [state, setState] = useState<ToastState>(globalState)

  const subscribe = useCallback((listener: (state: ToastState) => void) => {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter(l => l !== listener)
    }
  }, [])

  const toast = useCallback(({
    title,
    description,
    variant = 'default',
    duration = 5000,
    ...props
  }: Omit<Toast, 'id'>) => {
    const id = (++toastCounter).toString()

    const newToast: Toast = {
      id,
      title,
      description,
      variant,
      duration,
      ...props
    }

    dispatch({ type: 'ADD_TOAST', payload: newToast })

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', payload: id })
      }, duration)
    }

    return {
      id,
      dismiss: () => dispatch({ type: 'REMOVE_TOAST', payload: id }),
      update: (updates: Partial<Toast>) =>
        dispatch({
          type: 'ADD_TOAST',
          payload: { ...newToast, ...updates }
        })
    }
  }, [])

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      dispatch({ type: 'REMOVE_TOAST', payload: toastId })
    } else {
      dispatch({ type: 'CLEAR_TOASTS' })
    }
  }, [])

  // Subscribe to global state changes
  useState(() => {
    const unsubscribe = subscribe(setState)
    return unsubscribe
  })

  return {
    toast,
    dismiss,
    toasts: state.toasts
  }
}