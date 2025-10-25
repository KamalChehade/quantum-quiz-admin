const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { Participant, Answer, Question, QuestionLeaderboard, GameLeaderboard, GameSession, sequelize, Sequelize } = require('../models');
const { generateLeaderboardForQuestion } = require('../controllers/leaderboardController');
const { generateGameLeaderboard } = require('../controllers/gameLeaderboardController');

let io;
let activeAdminSocketId = null; // track which socket currently controls admin actions

// In-memory session snapshot for quick resume
let currentSession = {
    id: 1,
    status: 'waiting',
    currentQuestionId: null,
    startedAt: null,
};

const setCurrentSessionFromDb = async () => {
    try {
        const gs = await GameSession.findByPk(GAME_SESSION_ID);
        if (gs) {
            currentSession = {
                id: gs.id,
                status: gs.status || 'waiting',
                currentQuestionId: gs.currentQuestionId || null,
                startedAt: gs.startedAt || null,
            };
        }
    } catch (e) {
        console.error('Error loading current session from DB:', e);
    }
};

// Helpers for safer logging
const isDevelopment = process.env.NODE_ENV !== 'production';
const maskToken = (t) => {
    if (!t || typeof t !== 'string') return t;
    if (t.length <= 12) return t;
    return `${t.slice(0, 6)}...${t.slice(-6)}`;
};
const safeDecode = (t) => {
    try {
        const p = jwt.decode(t);
        if (!p || typeof p !== 'object') return null;
        return { id: p.id, username: p.username, role: p.role || p.role_name, iat: p.iat, exp: p.exp };
    } catch (e) {
        return null;
    }
};

// constant room for the single persistent session
const SESSION_ROOM = 'session_main';
const GAME_SESSION_ID = 1; // single persistent session id

// helper to check admin token (expects Authorization: Bearer <token>)
const isAdminSocket = (socket, token) => {
    try {
        const secret = process.env.JWT_SECRET;
        if (!token) {
            // log missing token for debugging
            try { console.log(`[ADMIN_AUTH] no token for socket=${socket?.id || '<unknown>'}`); } catch (e) { }
            return false;
        }
        let decoded;
        try {
            decoded = jwt.verify(token, secret);
        } catch (e) {
            try { console.log(`[ADMIN_AUTH] token verify failed for socket=${socket?.id || '<unknown>'} err=${e && e.message}`); } catch (e2) { }
            return false;
        }
        // Expect payload to contain role === 'admin' or role_name
        const role = decoded.role || decoded.role_name;
        try { console.log(`[ADMIN_AUTH] socket=${socket?.id || '<unknown>'} decodedRole=${role} id=${decoded && decoded.id}`); } catch (e) { }
        return role === 'admin';
    } catch (e) {
        return false;
    }
};

// helper to check if an admin socket is currently connected
const isAdminConnected = () => {
    try {
        return !!(activeAdminSocketId && io && io.sockets && io.sockets.sockets && io.sockets.sockets.get(activeAdminSocketId));
    } catch (e) {
        return false;
    }
};

exports.initSocket = (server) => {
    // Allow configuring socket path and allowed origins via environment
    // Default to the API base path so deployed frontend using /qa-api/socket.io works by default
    const socketPath = process.env.SOCKET_PATH || '/qa-api/socket.io';
    const allowedOrigins = [process.env.CLIENT_URL || 'https://itmedservices.com', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

    io = new Server(server, {
        path: socketPath,
        transports: ['websocket', 'polling'],
        cors: {
            origin: function (origin, callback) {
                // allow non-browser requests (curl/postman) with no origin
                if (!origin) return callback(null, true);
                if (allowedOrigins.includes(origin)) return callback(null, true);
                return callback(new Error('Not allowed by CORS'));
            },
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    console.log('✅ Socket.IO initialized');

    io.on('connection', (socket) => {
        console.log(`🟢 New connection: ${socket.id}`);

        // TEMP DEBUG: log handshake/auth info to help frontend debug (mask tokens)
        try {
            const rawAuth = socket.handshake.auth?.token || socket.handshake.headers?.authorization || socket.handshake.auth;
            if (rawAuth) {
                if (typeof rawAuth === 'string') {
                    // If header contains Bearer prefix, mask token portion but include "Bearer" label to match sample
                    if (/^Bearer\s+/i.test(rawAuth)) {
                        const tokenOnly = rawAuth.replace(/^Bearer\s+/i, '');
                        console.log('[SOCKET DEBUG] handshake.auth (token) =', 'Bearer' + maskToken(tokenOnly));
                        console.log('[SOCKET DEBUG] handshake.auth (decoded) =', safeDecode(tokenOnly));
                    } else {
                        console.log('[SOCKET DEBUG] handshake.auth (token) =', maskToken(rawAuth));
                        console.log('[SOCKET DEBUG] handshake.auth (decoded) =', safeDecode(rawAuth));
                    }
                } else {
                    // object form
                    const tokenInObj = rawAuth && rawAuth.token;
                    if (tokenInObj) {
                        console.log('[SOCKET DEBUG] handshake.auth.token =', maskToken(tokenInObj));
                        console.log('[SOCKET DEBUG] handshake.auth.token (decoded) =', safeDecode(tokenInObj));
                    } else {
                        console.log('[SOCKET DEBUG] handshake.auth =', rawAuth);
                    }
                    // also log header if present
                    if (socket.handshake.headers && socket.handshake.headers.authorization) {
                        const header = socket.handshake.headers.authorization;
                        if (/^Bearer\s+/i.test(header)) {
                            const tokenOnly = header.replace(/^Bearer\s+/i, '');
                            console.log('[SOCKET DEBUG] handshake.headers.authorization =', 'Bearer' + maskToken(tokenOnly));
                            console.log('[SOCKET DEBUG] handshake.headers.authorization (decoded) =', safeDecode(tokenOnly));
                        } else {
                            console.log('[SOCKET DEBUG] handshake.headers.authorization =', maskToken(header));
                            console.log('[SOCKET DEBUG] handshake.headers.authorization (decoded) =', safeDecode(header));
                        }
                    }
                }
            } else {
                // nothing provided
                if (socket.handshake.headers && socket.handshake.headers.authorization) {
                    const header = socket.handshake.headers.authorization;
                    if (/^Bearer\s+/i.test(header)) {
                        const tokenOnly = header.replace(/^Bearer\s+/i, '');
                        console.log('[SOCKET DEBUG] handshake.headers.authorization =', 'Bearer' + maskToken(tokenOnly));
                        console.log('[SOCKET DEBUG] handshake.headers.authorization (decoded) =', safeDecode(tokenOnly));
                    } else {
                        console.log('[SOCKET DEBUG] handshake.headers.authorization =', maskToken(header));
                        console.log('[SOCKET DEBUG] handshake.headers.authorization (decoded) =', safeDecode(header));
                    }
                } else {
                    console.log('[SOCKET DEBUG] handshake.auth = <no auth provided>');
                }
            }
        } catch (e) {
            console.log('[SOCKET DEBUG] error reading handshake info', e);
        }

        // determine admin status from handshake (Authorization header or token in handshake.auth)
        const rawAuth = socket.handshake.auth?.token || socket.handshake.headers?.authorization || socket.handshake.auth;
        let token = null;
        if (typeof rawAuth === 'string') {
            if (rawAuth.startsWith('Bearer ')) token = rawAuth.split(' ')[1];
            else token = rawAuth; // raw token provided directly
        }

        socket.data.isAdmin = isAdminSocket(socket, token);
        try {
            // log masked token and admin result for debugging presence issues
            const rawTokenForLog = token || (socket.handshake.auth && socket.handshake.auth.token) || (socket.handshake.headers && socket.handshake.headers.authorization);
            console.log('[ADMIN_AUTH_DEBUG]', 'socket=', socket.id, 'maskedToken=', maskToken(String(rawTokenForLog || '')), 'isAdmin=', socket.data.isAdmin);
        } catch (e) {
            console.error('Error logging admin auth debug', e);
        }
        if (socket.data.isAdmin) {
            console.log(`🔐 Admin socket connected: ${socket.id}`);
            // join admin room and set this socket as active admin
            socket.join('admin_room');
            activeAdminSocketId = socket.id;
            // emit resume state to admin
            socket.emit('admin_resume_state', { ...currentSession });
            // Broadcast admin presence to all connected clients
            try {
                io.emit('admin_presence', { present: true });
                console.log('✅ admin_presence broadcast: present=true');
            } catch (e) {
                console.error('Error broadcasting admin_presence true:', e);
            }

            // Proactively send lobby snapshot to this admin so dashboard restores immediately
            (async () => {
                try {
                    const participants = await Participant.findAll({ where: { gameSessionId: GAME_SESSION_ID } });
                    socket.emit('lobby_update', { participants, count: participants.length });
                } catch (e) {
                    console.error('Error sending initial lobby_update to admin:', e);
                }
            })();
        }

        // Temporary detailed debug: log all incoming events and their (masked) args
        // Enable by setting DEBUG_SOCKET=true in env. This is intentionally verbose and should be removed after debugging.
        if (process.env.DEBUG_SOCKET === 'true') {
            socket.onAny((event, ...args) => {
                try {
                    const safeArgs = args.map(a => {
                        // mask tokens in objects or strings
                        if (!a) return a;
                        if (typeof a === 'string') return maskToken(a);
                        if (typeof a === 'object') {
                            const copy = Array.isArray(a) ? [...a] : { ...a };
                            // mask common token fields if present
                            if (copy.token) copy.token = maskToken(copy.token);
                            if (copy.authorization) copy.authorization = maskToken(copy.authorization);
                            return copy;
                        }
                        return a;
                    });

                    console.log(`[SOCKET DEBUG] event='${event}' from=${socket.id} args=`, safeArgs);
                    // also show handshake auth/headers once per connection for quick reference
                    if (process.env.DEBUG_SOCKET_SHOW_HANDSHAKE === 'true') {
                        console.log('[SOCKET DEBUG] handshake.auth =', socket.handshake.auth ? (socket.handshake.auth.token ? maskToken(socket.handshake.auth.token) : socket.handshake.auth) : '<none>');
                        console.log('[SOCKET DEBUG] handshake.headers.authorization =', socket.handshake.headers && socket.handshake.headers.authorization ? maskToken(socket.handshake.headers.authorization) : '<none>');
                    }
                } catch (e) {
                    console.log('[SOCKET DEBUG] error in onAny debug handler', e && e.message);
                }
            });
        }


        // Initialize in-memory session from DB (best-effort)
        setCurrentSessionFromDb().catch(() => { });

        // Allow clients to probe admin presence with a fast ack
        socket.on('is_admin_present', (payload, ack) => {
            const present = isAdminConnected();
            if (typeof ack === 'function') {
                try { ack({ present }); } catch (e) { /* ack may throw in some clients */ }
            }
        });

        // Admin can request the current lobby snapshot via ack
        socket.on('admin_get_lobby', async (_payload, ack) => {
            try {
                const participants = await Participant.findAll({ where: { gameSessionId: GAME_SESSION_ID } });
                if (typeof ack === 'function') ack({ participants });
            } catch (e) {
                console.error('Error in admin_get_lobby:', e);
                if (typeof ack === 'function') ack({ participants: [] });
            }
        });

        // Admin can request a full state snapshot (session + lobby)
        socket.on('admin_get_state', async (_payload, ack) => {
            try {
                const participants = await Participant.findAll({ where: { gameSessionId: GAME_SESSION_ID } });
                const session = { ...currentSession };
                if (typeof ack === 'function') ack({ session, participants });
            } catch (e) {
                console.error('Error in admin_get_state:', e);
                if (typeof ack === 'function') ack({ session: { ...currentSession }, participants: [] });
            }
        });

        // Optional: Admin can request current question details (if any)
        socket.on('admin_get_question', async (_payload, ack) => {
            try {
                if (!currentSession.currentQuestionId) {
                    if (typeof ack === 'function') return ack({ question: null });
                    return;
                }
                const question = await Question.findByPk(currentSession.currentQuestionId);
                if (typeof ack === 'function') ack({ question: question || null });
            } catch (e) {
                console.error('Error in admin_get_question:', e);
                if (typeof ack === 'function') ack({ question: null });
            }
        });

        // Audience viewer joins the main session room for broadcasts
        socket.on('audience_join', () => {
            try {
                socket.join(SESSION_ROOM);
                console.log(`[AUDIENCE] ${socket.id} joined ${SESSION_ROOM}`);
            } catch (e) {
                console.error('Error in audience_join:', e);
            }
        });

        // Helper used by both audience question handlers
        const ackCurrentQuestionForAudience = async (ack) => {
            try {
                if (!currentSession.currentQuestionId) {
                    if (typeof ack === 'function') return ack({ question: null, status: currentSession.status });
                    return;
                }
                const question = await Question.findByPk(currentSession.currentQuestionId);
                if (typeof ack === 'function') {
                    return ack({ question: question || null, status: currentSession.status });
                }
            } catch (e) {
                console.error('Error in audience_get_question/get_current_question:', e);
                if (typeof ack === 'function') return ack({ question: null, status: currentSession.status });
            }
        };

        // Primary audience query
        socket.on('audience_get_question', async (_payload, ack) => {
            await ackCurrentQuestionForAudience(ack);
        });

        // Back-compat alias used by some clients
        socket.on('get_current_question', async (_payload, ack) => {
            await ackCurrentQuestionForAudience(ack);
        });

        // Helper used by both audience counts handlers
        const ackCurrentCountsForAudience = async (ack) => {
            const empty = { A: 0, B: 0, C: 0, D: 0 };
            try {
                const qid = currentSession.currentQuestionId;
                if (!qid) {
                    if (typeof ack === 'function') return ack({ counts: empty, status: currentSession.status });
                    return;
                }
                // Aggregate counts by selectedAnswer, counting distinct participants for safety
                const rows = await Answer.findAll({
                    where: { gameSessionId: GAME_SESSION_ID, questionId: qid },
                    attributes: [
                        'selectedAnswer',
                        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('participantId'))), 'count']
                    ],
                    group: ['selectedAnswer']
                });
                const counts = { ...empty };
                for (const r of rows) {
                    const key = r.get('selectedAnswer');
                    const cnt = Number(r.get('count') || 0);
                    if (key && counts.hasOwnProperty(key)) counts[key] = cnt;
                }
                if (typeof ack === 'function') return ack({ counts, status: currentSession.status });
            } catch (e) {
                console.error('Error in audience_get_counts/get_current_counts:', e);
                if (typeof ack === 'function') return ack({ counts: { A: 0, B: 0, C: 0, D: 0 }, status: currentSession.status });
            }
        };

        // Primary audience counts query
        socket.on('audience_get_counts', async (_payload, ack) => {
            await ackCurrentCountsForAudience(ack);
        });

        // Back-compat alias used by some clients
        socket.on('get_current_counts', async (_payload, ack) => {
            await ackCurrentCountsForAudience(ack);
        });

        // Honor admin_reconnect to hand control to the new admin socket id
        socket.on('admin_reconnect', () => {
            if (socket.data && socket.data.isAdmin) {
                activeAdminSocketId = socket.id;
                try {
                    io.emit('admin_presence', { present: true });
                } catch (e) {
                    console.error('Error rebroadcasting admin_presence on reconnect:', e);
                }
            }
        });
        /* -------------------------------------------
           🧍 Participant joins the quiz
           - create participant if not exists (by phone)
           - join `session_main` room
           - emit lobby_update to admin sockets
        ------------------------------------------- */
        socket.on('join_quiz', async ({ name, phone } = {}, ack) => {
            try {
                console.log(`join_quiz from ${socket.id} - ${name} / ${phone}`);

                // If this socket already joined, return existing participant immediately
                if (socket.data && socket.data.participantId) {
                    try {
                        const participant = await Participant.findByPk(socket.data.participantId);
                        if (participant) {
                            if (typeof ack === 'function') return ack({ ok: true, participant });
                            socket.emit('joined_success', { participant });
                            return;
                        }
                    } catch (_) {}
                }

                // Simple re-entrancy guard to avoid duplicate concurrent processing
                if (socket.data && socket.data._joining) {
                    if (typeof ack === 'function') return ack({ ok: false, message: 'joining_in_progress' });
                    return;
                }
                if (!socket.data) socket.data = {};
                socket.data._joining = true;

                // If no admin connected, deny join with ack (fast)
                if (!isAdminConnected()) {
                    console.log(`[INFO] join_quiz denied for ${socket.id} - no admin connected`);
                    if (typeof ack === 'function') return ack({ ok: false, message: 'no admin connected' });
                    return socket.emit('join_denied', { ok: false, reason: 'no admin connected' });
                }

                // Normalize and validate inputs
                const normName = String(name || '').trim();
                const normPhone = String(phone || '').trim();
                if (!normName || !normPhone) {
                    if (typeof ack === 'function') return ack({ ok: false, message: 'name_or_phone_missing' });
                    return;
                }

                // Atomically get or create participant for this session to prevent duplicates
                let participant;
                try {
                    const [p] = await Participant.findOrCreate({
                        where: { phone: normPhone, gameSessionId: GAME_SESSION_ID },
                        defaults: { name: normName, phone: normPhone, gameSessionId: GAME_SESSION_ID, score: 0 },
                    });
                    participant = p;
                } catch (e) {
                    // If unique constraint race occurs, fetch existing row
                    try {
                        participant = await Participant.findOne({ where: { phone: normPhone, gameSessionId: GAME_SESSION_ID } });
                    } catch (_) {}
                    if (!participant) throw e;
                }

                socket.data.participantId = participant.id;
                socket.join(SESSION_ROOM);

                // Acknowledge success (per new contract)
                if (typeof ack === 'function') {
                    ack({ ok: true, participant });
                }
                // Backwards-compatible emit
                socket.emit('joined_success', { participant });

                // Notify rooms with lobby update (admin + audience)
                const participants = await Participant.findAll({ where: { gameSessionId: GAME_SESSION_ID } });
                io.to('admin_room').emit('lobby_update', { participants, count: participants.length });
                io.to(SESSION_ROOM).emit('lobby_update', { participants, count: participants.length });

                // ========== ENHANCED: Better session state recovery ==========
                // If session is active AND there's a current question, send it to the player
                if (currentSession.status === 'active' && currentSession.currentQuestionId) {
                    try {
                        const question = await Question.findByPk(currentSession.currentQuestionId);
                        if (question) {
                            console.log(`[JOIN_QUIZ] Sending active question ${question.id} to rejoined player ${participant.id}`);

                            // Check if player already answered this question
                            const existingAnswer = await Answer.findOne({
                                where: {
                                    participantId: participant.id,
                                    questionId: currentSession.currentQuestionId,
                                    gameSessionId: GAME_SESSION_ID
                                }
                            });

                            // Send a SINGLE combined event instead of multiple events
                            if (existingAnswer) {
                                console.log(`[JOIN_QUIZ] Player ${participant.id} already answered question ${question.id}`);
                                socket.emit('question_resumed', {
                                    questionId: question.id,
                                    question: question,
                                    hasAnswered: true,
                                    selectedAnswer: existingAnswer.selectedAnswer,
                                    answeredAt: existingAnswer.answeredAt,
                                    isCorrect: existingAnswer.isCorrect
                                });
                            } else {
                                console.log(`[JOIN_QUIZ] Player ${participant.id} has not answered question ${question.id} yet`);
                                socket.emit('question_resumed', {
                                    questionId: question.id,
                                    question: question,
                                    hasAnswered: false,
                                    selectedAnswer: null
                                });
                            }
                        }
                    } catch (e) {
                        console.error('Error while resuming question for participant:', e);
                    }
                } else if (currentSession.status === 'active') {
                    // Session is active but no current question
                    console.log(`[JOIN_QUIZ] Session active but no current question for player ${participant.id}`);
                    socket.emit('game_started', { session: currentSession });
                } else if (currentSession.status === 'ended') {
                    // If game ended, send final leaderboard
                    try {
                        const leaderboard = await generateGameLeaderboard(GAME_SESSION_ID);
                        socket.emit('game_leaderboard', { leaderboard });
                    } catch (e) {
                        console.error('Error sending game leaderboard to rejoined player:', e);
                    }
                }
                // ========== END ENHANCEMENT ==========

            } catch (e) {
                console.error('Error in join_quiz:', e);
                if (typeof ack === 'function') {
                    try { ack({ ok: false, message: 'internal_error' }); } catch (e) { }
                }
            } finally {
                if (socket.data) socket.data._joining = false;
            }
        });
        /* -------------------------------------------
           🧑‍💼 Admin starts the game
                    const ts = new Date().toISOString();
                    io.emit('admin_presence', { present: true });
                    console.log(`✅ admin_presence broadcast: present=true socket=${socket.id} ts=${ts}`);
        ------------------------------------------- */
        socket.on('admin_start_game', async (payload, ack) => {
            try {
                console.log(`[SOCKET DEBUG] admin_start_game event received from ${socket.id}`);
                console.log('[SOCKET DEBUG] socket.data.isAdmin =', socket.data.isAdmin);
                console.log('[SOCKET DEBUG] handshake.auth.token =', socket.handshake.auth && socket.handshake.auth.token ? maskToken(socket.handshake.auth.token) : '<none>');
                try {
                    if (isDevelopment) console.log('[SOCKET DEBUG] decoded token (jwt.decode) =', safeDecode(token));
                } catch (e) {
                    console.log('[SOCKET DEBUG] could not decode token:', e && e.message);
                }
                if (!socket.data.isAdmin) {
                    if (typeof ack === 'function') ack({ ok: false, error: 'Unauthorized' });
                    return socket.emit('error', { message: 'Unauthorized' });
                }
                // if (activeAdminSocketId && activeAdminSocketId !== socket.id) {
                //     if (typeof ack === 'function') ack({ ok: false, error: 'Another admin is controlling the game' });
                //     return socket.emit('error', { message: 'Another admin controls the game' });
                // }
                console.log(`admin_start_game by ${socket.id}`);

                // Upsert single GameSession record with id=1
                let session = await GameSession.findByPk(GAME_SESSION_ID);
                if (!session) {
                    session = await GameSession.create({ id: GAME_SESSION_ID, status: 'active', startedAt: new Date(), currentQuestionId: null });
                } else {
                    // reset fields and clear old data: mark active and reset currentQuestionId
                    await session.update({ status: 'active', startedAt: new Date(), endedAt: null, currentQuestionId: null });
                    // Optionally clear answer/leaderboard tables -- keep minimal: delete question and game leaderboards and answers for session
                    await QuestionLeaderboard.destroy({ where: {} });
                    await GameLeaderboard.destroy({ where: { gameSessionId: GAME_SESSION_ID } });
                    await Answer.destroy({ where: { gameSessionId: GAME_SESSION_ID } });
                }

                // update in-memory session state
                currentSession = { id: session.id, status: session.status, currentQuestionId: session.currentQuestionId, startedAt: session.startedAt };
                io.to(SESSION_ROOM).emit('game_started', { session });
                console.log('game_started emitted');
                io.to('admin_room').emit('game_started', { session });
                if (typeof ack === 'function') ack({ ok: true, session, receivedAt: new Date().toISOString() });
            } catch (e) {
                console.error('Error in admin_start_game:', e);
                if (typeof ack === 'function') ack({ ok: false, error: String(e) });
            }
        });

        /* -------------------------------------------
           🧑‍💼 Admin starts a question
           - set GameSession.currentQuestionId
           - emit question_started to session_main
        ------------------------------------------- */
        socket.on('admin_start_question', async ({ questionId } = {}, ack) => {
            try {
                if (!socket.data.isAdmin) {
                    if (typeof ack === 'function') ack({ ok: false, error: 'Unauthorized' });
                    return socket.emit('error', { message: 'Unauthorized' });
                }
                // if (activeAdminSocketId && activeAdminSocketId !== socket.id) {
                //     if (typeof ack === 'function') ack({ ok: false, error: 'Another admin is controlling the game' });
                //     return socket.emit('error', { message: 'Another admin controls the game' });
                // }
                console.log(`admin_start_question ${questionId} by ${socket.id}`);

                const session = await GameSession.findByPk(GAME_SESSION_ID);
                if (!session) return socket.emit('error', { message: 'No active session' });

                await session.update({ currentQuestionId: questionId });
                const question = await Question.findByPk(questionId);

                // update in-memory session state and notify players/admins
                currentSession.currentQuestionId = questionId;
                currentSession.status = 'active';

                io.to(SESSION_ROOM).emit('question_started', { questionId, question });
                console.log('question_started emitted');
                io.to('admin_room').emit('question_started', { questionId, question });
                if (typeof ack === 'function') ack({ ok: true, questionId, receivedAt: new Date().toISOString() });
            } catch (e) {
                console.error('Error in admin_start_question:', e);
                if (typeof ack === 'function') ack({ ok: false, error: String(e) });
            }
        });

        /* -------------------------------------------
           🧍 Participant submits an answer
           - prevent duplicate answers
           - store Answer with gameSessionId = 1
           - emit answer_received back to player
        ------------------------------------------- */
        socket.on('submit_answer', async ({ questionId, selectedAnswer }) => {
            try {
                const participantId = socket.data.participantId;
                if (!participantId) return socket.emit('error', { message: 'Not joined' });

                console.log(`submit_answer by participant ${participantId} for question ${questionId}`);

                // Always evaluate correctness against the current question
                const question = await Question.findByPk(questionId);
                const isCorrect = !!(question && question.correctAnswer === selectedAnswer);

                // Find existing answer for this participant/question/session
                const existing = await Answer.findOne({ where: { participantId, questionId, gameSessionId: GAME_SESSION_ID } });
                if (existing) {
                    // Update existing answer with the latest choice
                    await existing.update({
                        selectedAnswer,
                        isCorrect,
                        answeredAt: new Date(),
                    });

                    socket.emit('answer_received', { success: true, isCorrect, updated: true });

                    // Notify admin sockets (mark as updated)
                    try {
                        const participantInfo = await Participant.findByPk(participantId, { attributes: ['id', 'name', 'phone'] });
                        io.to('admin_room').emit('participant_submitted', {
                            participant: participantInfo,
                            questionId,
                            selectedAnswer,
                            isCorrect,
                            answeredAt: existing.answeredAt || new Date(),
                            gameSessionId: GAME_SESSION_ID,
                            updated: true,
                        });
                        // Optional: also broadcast to audience room for live bars
                        if (process.env.AUDIENCE_LIVE_BARS === 'true') {
                            io.to(SESSION_ROOM).emit('participant_submitted', {
                                participant: participantInfo, // optionally anonymize
                                questionId,
                                selectedAnswer,
                                isCorrect,
                                answeredAt: existing.answeredAt || new Date(),
                                gameSessionId: GAME_SESSION_ID,
                                updated: true,
                            });
                        }
                    } catch (e) {
                        console.error('Error emitting participant_submitted (updated) to admin:', e);
                    }

                    return; 
                }

                // No existing row — create a new answer entry
                const answer = await Answer.create({
                    participantId,
                    questionId,
                    selectedAnswer,
                    isCorrect,
                    answeredAt: new Date(),
                    gameSessionId: GAME_SESSION_ID,
                });

                socket.emit('answer_received', { success: true, isCorrect });

                // Notify admin sockets in real-time about this submission
                try {
                    const participantInfo = await Participant.findByPk(participantId, { attributes: ['id', 'name', 'phone'] });
                    io.to('admin_room').emit('participant_submitted', {
                        participant: participantInfo,
                        questionId,
                        selectedAnswer,
                        isCorrect,
                        answeredAt: answer.answeredAt || new Date(),
                        gameSessionId: GAME_SESSION_ID,
                    });
                    // Optional: also broadcast to audience room for live bars
                    if (process.env.AUDIENCE_LIVE_BARS === 'true') {
                        io.to(SESSION_ROOM).emit('participant_submitted', {
                            participant: participantInfo, // optionally anonymize
                            questionId,
                            selectedAnswer,
                            isCorrect,
                            answeredAt: answer.answeredAt || new Date(),
                            gameSessionId: GAME_SESSION_ID,
                        });
                    }
                } catch (e) {
                    console.error('Error emitting participant_submitted to admin:', e);
                }
            } catch (e) {
                console.error('Error in submit_answer:', e);
            }
        });

        /* -------------------------------------------
           🧑‍💼 Admin ends a question
           - generate leaderboard for that question
           - emit question_leaderboard to session_main
        ------------------------------------------- */
        socket.on('admin_end_question', async ({ questionId } = {}, ack) => {
            try {
                if (!socket.data.isAdmin) {
                    if (typeof ack === 'function') ack({ ok: false, error: 'Unauthorized' });
                    return socket.emit('error', { message: 'Unauthorized' });
                }
                // if (activeAdminSocketId && activeAdminSocketId !== socket.id) {
                //     if (typeof ack === 'function') ack({ ok: false, error: 'Another admin is controlling the game' });
                //     return socket.emit('error', { message: 'Another admin controls the game' });
                // }
                console.log(`admin_end_question ${questionId} by ${socket.id}`);

                const leaderboard = await generateLeaderboardForQuestion(questionId);
                // clear current question in in-memory session
                currentSession.currentQuestionId = null;

                io.to(SESSION_ROOM).emit('question_leaderboard', { questionId, leaderboard });
                io.to('admin_room').emit('question_leaderboard', { questionId, leaderboard });
                console.log('question_leaderboard emitted');
                if (typeof ack === 'function') ack({ ok: true, questionId, receivedAt: new Date().toISOString(), leaderboard });
            } catch (e) {
                console.error('Error in admin_end_question:', e);
                if (typeof ack === 'function') ack({ ok: false, error: String(e) });
            }
        });

        /* -------------------------------------------
           🧑‍💼 Admin ends game
           - set GameSession.status = 'ended'
           - call generateGameLeaderboard(1)
           - emit final game_leaderboard to all users
        ------------------------------------------- */
        // NOTE: Ending the game via socket has been disabled. Use the admin HTTP endpoint
        // or the admin UI to finalize and archive the game instead. This keeps a single
        // server-side contract point for ending games and avoids race conditions from sockets.
        socket.on('admin_end_game', async (_payload, ack) => {
            console.log(`admin_end_game socket call received from ${socket.id} but socket-based end is disabled`);
            if (typeof ack === 'function') {
                try {
                    ack({ ok: false, message: 'socket_end_disabled', info: 'Ending the game via socket is disabled. Use the admin HTTP endpoint or admin UI.' });
                } catch (e) { }
            }
            // Also emit a client-side event for backwards compatibility
            socket.emit('game_end_disabled', { message: 'socket_end_disabled' });
        });

        /* -------------------------------------------
           Disconnect
        ------------------------------------------- */
        socket.on('disconnect', async () => {
            console.log(`🔴 Disconnected: ${socket.id}`);
            if (socket.data?.isAdmin && activeAdminSocketId === socket.id) {
                console.log('[INFO] active admin disconnected, clearing activeAdminSocketId');
                activeAdminSocketId = null;
                try {
                    const ts = new Date().toISOString();
                    io.emit('admin_presence', { present: false });
                    console.log(`✅ admin_presence broadcast: present=false socket=${socket.id} ts=${ts}`);
                } catch (e) {
                    console.error('Error broadcasting admin_presence false:', e);
                }
            }
            // If a participant disconnected, refresh lobby counts for all
            if (socket.data?.participantId) {
                try {
                    const participants = await Participant.findAll({ where: { gameSessionId: GAME_SESSION_ID } });
                    io.to('admin_room').emit('lobby_update', { participants, count: participants.length });
                    io.to(SESSION_ROOM).emit('lobby_update', { participants, count: participants.length });
                } catch (e) {
                    console.error('Error emitting lobby_update on participant disconnect:', e);
                }
            }
        });
    });

    return io;
};

// Expose a helper to clear in-memory live session data and notify admin/players
exports.clearLiveData = async (gameSessionId = GAME_SESSION_ID) => {
    try {
        // reset in-memory session snapshot
        currentSession = { id: gameSessionId, status: 'waiting', currentQuestionId: null, startedAt: null };
        // clear active admin marker so a future admin can re-take control
        activeAdminSocketId = null;

        // Notify connected clients so frontends can clear live feeds/UI
        if (io) {
            try {
                io.to('admin_room').emit('session_reset', { gameSessionId });
                io.to(SESSION_ROOM).emit('session_reset', { gameSessionId });
                console.log('\u2705 Emitted session_reset to admin_room and session_main');
                // Also emit a fresh empty lobby snapshot so UIs reset participant counts
                io.to('admin_room').emit('lobby_update', { participants: [], count: 0 });
                io.to(SESSION_ROOM).emit('lobby_update', { participants: [], count: 0 });
            } catch (e) {
                console.error('Error emitting session_reset:', e);
            }
        }
    } catch (e) {
        console.error('Error in clearLiveData:', e);
        throw e;
    }
};

exports.getIO = () => io;