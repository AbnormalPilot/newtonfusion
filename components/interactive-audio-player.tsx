"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Repeat,
  Heart,
  HeartHandshake,
  SkipBack,
  SkipForward,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface InteractiveAudioPlayerProps {
  audioUrl: string
  title: string
  duration: number
  isGenerating?: boolean
  onAudioReady?: () => void
  onAudioError?: () => void
  onSave?: () => void
  audioBlob?: Blob
}

export function InteractiveAudioPlayer({
  audioUrl,
  title,
  duration,
  isGenerating = false,
  onAudioReady,
  onAudioError,
  onSave,
  audioBlob,
}: InteractiveAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [actualDuration, setActualDuration] = useState(duration)
  const [volume, setVolume] = useState([75])
  const [isMuted, setIsMuted] = useState(false)
  const [isLooping, setIsLooping] = useState(false)
  const [canPlay, setCanPlay] = useState(false)
  const [buffered, setBuffered] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const handleEnded = () => {
      setIsPlaying(false)
      if (!isLooping) setCurrentTime(0)
    }
    const handleCanPlay = () => {
      console.log("[v0] Audio ready to play")
      setCanPlay(true)
      onAudioReady?.()
    }
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        console.log("[v0] Audio duration loaded:", audio.duration, "seconds")
        setActualDuration(audio.duration)
      }
    }
    const handleError = (e: Event) => {
      console.log("[v0] Audio failed to load:", (e.target as HTMLAudioElement)?.error)
      setCanPlay(false)
      setIsPlaying(false)
      onAudioError?.()
    }
    const handleLoadStart = () => {
      console.log("[v0] Audio loading started")
      setCanPlay(false)
    }
    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1)
        const bufferedPercent = (bufferedEnd / actualDuration) * 100
        setBuffered(bufferedPercent)
      }
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("canplaythrough", handleCanPlay)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("error", handleError)
    audio.addEventListener("loadstart", handleLoadStart)
    audio.addEventListener("progress", handleProgress)
    audio.loop = isLooping
    audio.volume = isMuted ? 0 : volume[0] / 100

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("canplaythrough", handleCanPlay)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("error", handleError)
      audio.removeEventListener("loadstart", handleLoadStart)
      audio.removeEventListener("progress", handleProgress)
    }
  }, [volume, isMuted, isLooping, actualDuration])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (audioUrl && audioUrl.trim() !== "") {
      audio.src = audioUrl
      audio.load()
      setIsSaved(false)
      setActualDuration(duration)
    } else {
      audio.removeAttribute("src")
      setCanPlay(false)
      setIsPlaying(false)
      setCurrentTime(0)
      setActualDuration(duration)
    }
  }, [audioUrl, duration])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio || !audioUrl || audioUrl.trim() === "" || !canPlay) {
      console.log("[v0] Cannot play: audio not ready or no source available")
      return
    }

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
          })
          .catch((error) => {
            console.error("[v0] Audio play failed:", error)
            setIsPlaying(false)
          })
      }
    }
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio || !audioUrl || audioUrl.trim() === "" || !canPlay) return

    const newTime = (value[0] / 100) * actualDuration
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value)
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const seekRelative = (seconds: number) => {
    const audio = audioRef.current
    if (!audio || !audioUrl || audioUrl.trim() === "" || !canPlay) return

    const newTime = Math.max(0, Math.min(actualDuration, currentTime + seconds))
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progress = actualDuration > 0 ? (currentTime / actualDuration) * 100 : 0

  const handleSave = async () => {
    if (!audioBlob || !canPlay || isSaving) return

    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, `${title}.mp3`)
      formData.append("title", title)
      formData.append("prompt", title)
      formData.append("duration_seconds", duration.toString())

      console.log("[v0] Sending save request with FormData keys:", Array.from(formData.keys()))

      const saveResponse = await fetch("/api/music-library", {
        method: "POST",
        body: formData,
      })

      console.log("[v0] Save response status:", saveResponse.status, saveResponse.statusText)

      let responseData
      const contentType = saveResponse.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        responseData = await saveResponse.json()
      } else {
        const textResponse = await saveResponse.text()
        console.log("[v0] Non-JSON response received:", textResponse.substring(0, 200))
        throw new Error(`Server returned HTML error page (status ${saveResponse.status})`)
      }

      if (saveResponse.ok) {
        setIsSaved(true)
        onSave?.()
        toast({
          title: "Track saved!",
          description: "Your music has been added to your library",
        })
      } else {
        throw new Error(responseData.error || `Failed to save track (status ${saveResponse.status})`)
      }
    } catch (error) {
      console.error("[v0] Error saving track:", error)
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Could not save track to library",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 p-3 bg-black/90 border-t border-white/10 backdrop-blur-md">
      <audio ref={audioRef} preload="metadata" />

      {/* Left Section: Album Art + Track Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xs">
        <img
          src="/beautiful-aurora-borealis-northern-lights-dancing-.jpg"
          alt="Album Cover"
          className="w-12 h-12 rounded object-cover shadow-md flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-white truncate">{title}</h4>
          <p className="text-xs text-white/60 truncate">AI Generated Music</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={!audioBlob || !canPlay || isSaving || isSaved}
          className={`p-1.5 hover:bg-white/10 flex-shrink-0 ${
            isSaved ? "text-[#077AFE]" : "text-white/60 hover:text-white"
          }`}
        >
          {isSaved ? <HeartHandshake className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
        </Button>
      </div>

      {/* Center Section: Playback Controls + Progress */}
      <div className="flex flex-col items-center gap-2 flex-1 max-w-lg">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => seekRelative(-10)}
            disabled={isGenerating || !audioUrl || !canPlay}
            className="text-white/60 hover:text-white hover:bg-white/10 p-2"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            onClick={togglePlayPause}
            disabled={isGenerating || !audioUrl || audioUrl.trim() === "" || !canPlay}
            size="sm"
            className="h-8 w-8 rounded-full bg-white hover:bg-white/90 text-black shadow-lg disabled:opacity-50"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => seekRelative(10)}
            disabled={isGenerating || !audioUrl || !canPlay}
            className="text-white/60 hover:text-white hover:bg-white/10 p-2"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full">
          <span className="text-xs text-white/60 w-10 text-right">{formatTime(currentTime)}</span>
          <div className="flex-1 relative">
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="w-full [&_[role=slider]]:bg-white [&_[role=slider]]:border-white [&_.bg-primary]:bg-white [&_[role=slider]]:w-3 [&_[role=slider]]:h-3"
              disabled={isGenerating}
            />
            <div
              className="absolute top-1/2 left-0 h-1 bg-white/20 rounded-full -translate-y-1/2 pointer-events-none"
              style={{ width: `${buffered}%` }}
            />
          </div>
          <span className="text-xs text-white/60 w-10">{formatTime(actualDuration)}</span>
        </div>
      </div>

      {/* Right Section: Volume + Additional Controls */}
      <div className="flex items-center gap-2 min-w-0 flex-1 max-w-xs justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsLooping(!isLooping)}
          className={`p-1.5 hover:bg-white/10 ${isLooping ? "text-[#077AFE]" : "text-white/60 hover:text-white"}`}
        >
          <Repeat className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (!audioUrl || audioUrl.trim() === "" || !canPlay) return
            const link = document.createElement("a")
            link.href = audioUrl
            link.download = `${title}.mp3`
            link.click()
          }}
          disabled={!audioUrl || audioUrl.trim() === "" || !canPlay}
          className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 disabled:opacity-30"
        >
          <Download className="h-4 w-4" />
        </Button>

        <div className="hidden sm:flex items-center gap-2 min-w-0 w-20 md:w-24 lg:w-28">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 flex-shrink-0"
          >
            {isMuted || volume[0] === 0 ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          </Button>
          <Slider
            value={isMuted ? [0] : volume}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="flex-1 min-w-0 [&_[role=slider]]:bg-white [&_[role=slider]]:border-white [&_.bg-primary]:bg-white [&_[role=slider]]:w-2.5 [&_[role=slider]]:h-2.5"
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMute}
          className="sm:hidden text-white/60 hover:text-white hover:bg-white/10 p-1.5"
        >
          {isMuted || volume[0] === 0 ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  )
}
