"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Music, ChevronLeft, ChevronRight, Play, Clock, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface MusicTrack {
  id: number
  title: string
  prompt: string
  duration_seconds: number
  file_url: string
  created_at: string
}

interface MusicLibrarySidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  onTrackSelect: (track: MusicTrack) => void
}

export function MusicLibrarySidebar({ isCollapsed, onToggle, onTrackSelect }: MusicLibrarySidebarProps) {
  const [tracks, setTracks] = useState<MusicTrack[]>([])
  const [filteredTracks, setFilteredTracks] = useState<MusicTrack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchTracks()

    const handleRefresh = () => fetchTracks()
    window.addEventListener("refreshLibrary", handleRefresh)
    return () => window.removeEventListener("refreshLibrary", handleRefresh)
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTracks(tracks)
    } else {
      const filtered = tracks.filter(
        (track) =>
          track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          track.prompt.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredTracks(filtered)
    }
  }, [tracks, searchQuery])

  const fetchTracks = async () => {
    try {
      const response = await fetch("/api/music-library")
      if (response.ok) {
        const data = await response.json()
        setTracks(data.tracks || [])
      }
    } catch (error) {
      console.error("Failed to fetch tracks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTrackSelect = (track: MusicTrack) => {
    setSelectedTrack(track.id)
    onTrackSelect(track)
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div
      className={`bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-12" : "w-64 sm:w-72 lg:w-80"
      }`}
    >
      {/* Header */}
      <div className="p-2 sm:p-4 border-b border-sidebar-border flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 sm:h-5 sm:w-5 text-[#077AFE]" />
            <h2 className="font-semibold text-sidebar-foreground text-sm sm:text-base">Music Library</h2>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="text-sidebar-foreground hover:bg-sidebar-accent/20 h-6 w-6 sm:h-8 sm:w-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          ) : (
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
        </Button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <>
          <div className="p-2 sm:p-4 border-b border-sidebar-border">
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-sidebar-foreground/40" />
              <Input
                placeholder="Search tracks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 sm:pl-10 bg-sidebar-primary/20 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 text-sm h-8 sm:h-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 sm:p-4 space-y-2 sm:space-y-3 w-[300px] min-h-[80vh] max-h-[80vh] overflow-y-auto scrollbar-hide">
              {isLoading ? (
                <div className="text-center text-sidebar-foreground/60 py-6 sm:py-8 text-sm">Loading tracks...</div>
              ) : filteredTracks.length === 0 ? (
                <div className="text-center text-sidebar-foreground/60 py-6 sm:py-8">
                  <Music className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                  {searchQuery ? (
                    <>
                      <p className="text-xs sm:text-sm">No tracks found</p>
                      <p className="text-xs mt-1">Try a different search term</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs sm:text-sm">No saved tracks yet</p>
                      <p className="text-xs mt-1">Generate and save music to build your library</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="text-xs text-sidebar-foreground/50 mb-2 sm:mb-3 px-1">
                    {filteredTracks.length} track{filteredTracks.length !== 1 ? "s" : ""}
                    {searchQuery && ` matching "${searchQuery}"`}
                  </div>

                  {filteredTracks.map((track) => (
                    <Card
                      key={track.id}
                      className={`border-sidebar-border hover:bg-sidebar-accent/10 cursor-pointer transition-colors ${
                        selectedTrack === track.id
                          ? "bg-sidebar-accent/20 border-[#077AFE]/50"
                          : "bg-sidebar-primary/20"
                      }`}
                      onClick={() => handleTrackSelect(track)}
                    >
                      <CardContent className="p-2 sm:p-3 w-full overflow-hidden">
                        <div className="flex flex-col gap-2 w-full min-w-0">
                          {/* Header row with play button only */}
                          <div className="flex items-center justify-between w-full">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[#077AFE] hover:bg-[#077AFE]/20 p-1 h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTrackSelect(track)
                              }}
                            >
                              <Play className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            </Button>
                          </div>

                          {/* Track info section */}
                          <div className="space-y-1 w-full min-w-0">
                            <h3 className="font-medium text-sidebar-foreground text-xs sm:text-sm truncate leading-tight w-full">
                              {track.title}
                            </h3>
                            <p className="text-xs text-sidebar-foreground/60 line-clamp-2 leading-tight w-full break-words">
                              {track.prompt}
                            </p>
                          </div>

                          {/* Metadata row */}
                          <div className="flex items-center justify-between text-xs text-sidebar-foreground/50 w-full">
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Clock className="h-2.5 w-2.5" />
                              <span>{formatDuration(track.duration_seconds)}</span>
                            </div>
                            <span className="hidden sm:inline text-xs truncate ml-2 min-w-0">
                              {formatDate(track.created_at)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  )
}
