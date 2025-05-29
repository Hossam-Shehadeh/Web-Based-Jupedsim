"use client"

import { useEffect } from "react"
import { AlertTriangle, X, Info, CheckCircle } from "lucide-react"
import { useSimulation } from "./simulation-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

type AlertType = "warning" | "info" | "success" | "error"

export function AlertNotification() {
  const { alertMessage, setAlertMessage } = useSimulation()

  // Parse the alert message to extract type if it's in the format "type:message"
  const parseAlert = (): { type: AlertType; message: string } => {
    if (!alertMessage) return { type: "warning", message: "" }

    if (alertMessage.startsWith("info:")) {
      return { type: "info", message: alertMessage.substring(5) }
    } else if (alertMessage.startsWith("success:")) {
      return { type: "success", message: alertMessage.substring(8) }
    } else if (alertMessage.startsWith("error:")) {
      return { type: "error", message: alertMessage.substring(6) }
    } else if (alertMessage.startsWith("warning:")) {
      return { type: "warning", message: alertMessage.substring(8) }
    } else {
      return { type: "warning", message: alertMessage }
    }
  }

  const { type, message } = parseAlert()

  // Auto-dismiss the alert after 5 seconds
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [alertMessage, setAlertMessage])

  if (!alertMessage) return null

  // Define styles based on alert type
  const styles = {
    warning: {
      bg: "bg-yellow-50 dark:bg-yellow-900/30",
      border: "border-yellow-400 dark:border-yellow-800",
      text: "text-yellow-800 dark:text-yellow-300",
      icon: <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />,
      button: "text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-800/50",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-900/30",
      border: "border-blue-400 dark:border-blue-800",
      text: "text-blue-800 dark:text-blue-300",
      icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5" />,
      button: "text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800/50",
    },
    success: {
      bg: "bg-green-50 dark:bg-green-900/30",
      border: "border-green-400 dark:border-green-800",
      text: "text-green-800 dark:text-green-300",
      icon: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />,
      button: "text-green-600 hover:bg-green-100 dark:hover:bg-green-800/50",
    },
    error: {
      bg: "bg-red-50 dark:bg-red-900/30",
      border: "border-red-400 dark:border-red-800",
      text: "text-red-800 dark:text-red-300",
      icon: <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5" />,
      button: "text-red-600 hover:bg-red-100 dark:hover:bg-red-800/50",
    },
  }

  const style = styles[type]

  return (
    <AnimatePresence>
      {alertMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-auto min-w-[300px] max-w-md"
        >
          <Alert variant="warning" className={`shadow-lg ${style.border} ${style.bg}`}>
            <div className="flex items-start gap-2">
              {style.icon}
              <AlertDescription className={style.text}>{message}</AlertDescription>
              <Button
                variant="ghost"
                size="icon"
                className={`ml-auto -mt-1 -mr-1 h-7 w-7 ${style.button}`}
                onClick={() => setAlertMessage(null)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Dismiss</span>
              </Button>
            </div>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
