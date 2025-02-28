import React from 'react'
import { PiLightbulbFilamentDuotone } from 'react-icons/pi';


interface LoadingMessageProps {
    isThinking: boolean;
    isTyping: boolean;
    error: string;
}

const LoadingMessage: React.FC<LoadingMessageProps> = ({
    isThinking,
    isTyping,
    error
}) => {
  return (
    <>
        {(isTyping || isThinking) && !error && (
            <div className="flex items-center space-x-2">
              <PiLightbulbFilamentDuotone
                color="#FBAB57"
                className="w-8 h-8"
              />
              <div className="flex items-center gap-2">
                <p className="text-sm">Thinking</p>
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="animate-bounce">●</div>
                  <div className="animate-bounce delay-100">●</div>
                  <div className="animate-bounce delay-200">●</div>
                </div>
              </div>
            </div>
          )}
    </>
  )
}

export default React.memo(LoadingMessage)