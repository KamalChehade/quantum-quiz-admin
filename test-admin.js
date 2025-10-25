const io = require('socket.io-client');
const jwt = require('jsonwebtoken');

const SERVER = 'http://localhost:3000';
const ADMIN_PAYLOAD = { id: 1, username: 'admin', role: 'admin' };
const token = jwt.sign(ADMIN_PAYLOAD, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

const socket = io(SERVER, { auth: { token } });

socket.on('connect', () => {
  console.log('admin connected', socket.id);

  // Start game
  setTimeout(() => {
    console.log('admin emitting admin_start_game');
    socket.emit('admin_start_game');
  }, 500);

  // Start question 1 after 1s
  setTimeout(() => {
    console.log('admin emitting admin_start_question 1');
    socket.emit('admin_start_question', { questionId: 1 });
  }, 1500);

  // End question 1 after 5s
  setTimeout(() => {
    console.log('admin emitting admin_end_question 1');
    socket.emit('admin_end_question', { questionId: 1 });
  }, 6500);

  // End game after 9s
  setTimeout(() => {
    console.log('admin emitting admin_end_game');
    socket.emit('admin_end_game');
  }, 9500);
});

socket.on('lobby_update', data => console.log('admin lobby_update', data && data.count));
socket.on('game_started', data => console.log('admin game_started', data && data.session && data.session.status));
socket.on('question_started', data => console.log('admin question_started', data && data.questionId));
socket.on('question_leaderboard', data => console.log('admin question_leaderboard', data && data.leaderboard && data.leaderboard.length));
socket.on('game_leaderboard', data => console.log('admin game_leaderboard', data && data.leaderboard && data.leaderboard.length));

socket.on('connect_error', err => console.error('connect_error', err));

setTimeout(() => socket.close(), 20000);
