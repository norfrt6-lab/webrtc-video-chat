const path = require('path');
const config = require('./config');

let db = null;

try {
  const Database = require('better-sqlite3');
  const dbPath = path.resolve(config.DB_PATH);
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      ended_at INTEGER,
      participant_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS chat_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id)
    );

    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      socket_id TEXT,
      joined_at INTEGER NOT NULL,
      left_at INTEGER,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id)
    );

    CREATE INDEX IF NOT EXISTS idx_meetings_room ON meetings(room_id);
    CREATE INDEX IF NOT EXISTS idx_chat_meeting ON chat_logs(meeting_id);
    CREATE INDEX IF NOT EXISTS idx_participants_meeting ON participants(meeting_id);
  `);

  console.log('SQLite database initialized at', dbPath);
} catch (err) {
  console.warn('SQLite not available (install better-sqlite3 for persistence):', err.message);
}

const stmts = {};
if (db) {
  stmts.createMeeting = db.prepare('INSERT INTO meetings (room_id, created_at, participant_count) VALUES (?, ?, 0)');
  stmts.endMeeting = db.prepare('UPDATE meetings SET ended_at = ?, participant_count = ? WHERE id = ?');
  stmts.logChat = db.prepare('INSERT INTO chat_logs (meeting_id, username, message, timestamp) VALUES (?, ?, ?, ?)');
  stmts.addParticipant = db.prepare('INSERT INTO participants (meeting_id, username, socket_id, joined_at) VALUES (?, ?, ?, ?)');
  stmts.removeParticipant = db.prepare('UPDATE participants SET left_at = ? WHERE meeting_id = ? AND socket_id = ? AND left_at IS NULL');
  stmts.getMeetings = db.prepare('SELECT * FROM meetings ORDER BY created_at DESC LIMIT ? OFFSET ?');
  stmts.getMeetingCount = db.prepare('SELECT COUNT(*) as count FROM meetings');
  stmts.getMeeting = db.prepare('SELECT * FROM meetings WHERE id = ?');
  stmts.getChatLogs = db.prepare('SELECT * FROM chat_logs WHERE meeting_id = ? ORDER BY timestamp ASC');
  stmts.getParticipants = db.prepare('SELECT * FROM participants WHERE meeting_id = ?');
}

module.exports = {
  createMeeting(roomId) {
    if (!db) return null;
    const result = stmts.createMeeting.run(roomId, Date.now());
    return result.lastInsertRowid;
  },

  endMeeting(meetingId, participantCount) {
    if (!db) return;
    stmts.endMeeting.run(Date.now(), participantCount, meetingId);
  },

  logChat(meetingId, username, message) {
    if (!db) return;
    stmts.logChat.run(meetingId, username, message, Date.now());
  },

  addParticipant(meetingId, username, socketId) {
    if (!db) return;
    stmts.addParticipant.run(meetingId, username, socketId, Date.now());
  },

  removeParticipant(meetingId, socketId) {
    if (!db) return;
    stmts.removeParticipant.run(Date.now(), meetingId, socketId);
  },

  getMeetingHistory(page, perPage) {
    if (!db) return { meetings: [], total: 0 };
    page = page || 1;
    perPage = perPage || 20;
    const offset = (page - 1) * perPage;
    const meetings = stmts.getMeetings.all(perPage, offset);
    const { count } = stmts.getMeetingCount.get();
    return { meetings, total: count };
  },

  getMeetingDetail(meetingId) {
    if (!db) return null;
    const meeting = stmts.getMeeting.get(meetingId);
    if (!meeting) return null;
    const chatLogs = stmts.getChatLogs.all(meetingId);
    const participants = stmts.getParticipants.all(meetingId);
    return { meeting, chatLogs, participants };
  }
};
