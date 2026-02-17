"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Users, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MeetingHistoryItem, MeetingDetail } from "@/lib/types";

const API_BASE = "http://localhost:3000";

export default function HistoryPage() {
  const [meetings, setMeetings] = useState<MeetingHistoryItem[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [detail, setDetail] = useState<MeetingDetail | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetings(1);
  }, []);

  const fetchMeetings = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/history?page=${p}&limit=10`);
      const data = await res.json();
      if (p === 1) {
        setMeetings(data.meetings);
      } else {
        setMeetings((prev) => [...prev, ...data.meetings]);
      }
      setHasMore(data.meetings.length === 10);
      setPage(p);
    } catch {
      // API not available
    }
    setLoading(false);
  };

  const toggleDetail = async (id: number) => {
    if (expanded === id) {
      setExpanded(null);
      setDetail(null);
      return;
    }
    setExpanded(id);
    try {
      const res = await fetch(`${API_BASE}/api/history/${id}`);
      const data = await res.json();
      setDetail(data);
    } catch {
      setDetail(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return "In progress";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Meeting History</h1>
            <p className="text-sm text-muted-foreground">
              Past meeting records and chat logs
            </p>
          </div>
        </div>

        {loading && meetings.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No meetings recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map((m) => (
              <div
                key={m.id}
                className="rounded-lg border bg-card transition-colors hover:bg-card/80"
              >
                <button
                  onClick={() => toggleDetail(m.id)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div className="space-y-1">
                    <p className="font-medium">Room: {m.room_id}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(m.started_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {m.participant_count}
                      </span>
                      <span>{formatDuration(m.started_at, m.ended_at)}</span>
                    </div>
                  </div>
                  {expanded === m.id ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                {expanded === m.id && detail && (
                  <div className="border-t px-4 pb-4 pt-3">
                    {detail.participants.length > 0 && (
                      <div className="mb-3">
                        <h3 className="mb-2 text-sm font-medium flex items-center gap-1.5">
                          <Users className="h-4 w-4" /> Participants
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {detail.participants.map((p, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-secondary px-3 py-1 text-xs"
                            >
                              {p.username}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {detail.chat_logs.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-sm font-medium flex items-center gap-1.5">
                          <MessageSquare className="h-4 w-4" /> Chat Log
                        </h3>
                        <ScrollArea className="max-h-60">
                          <div className="space-y-1">
                            {detail.chat_logs.map((c, i) => (
                              <div key={i} className="text-sm">
                                <span className="font-medium text-primary">
                                  {c.username}:
                                </span>{" "}
                                <span className="text-muted-foreground">
                                  {c.message}
                                </span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    {detail.participants.length === 0 &&
                      detail.chat_logs.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No detailed data available
                        </p>
                      )}
                  </div>
                )}
              </div>
            ))}

            {hasMore && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fetchMeetings(page + 1)}
                disabled={loading}
              >
                {loading ? "Loading..." : "Load More"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
