const io = require('socket.io-client');
const SERVER = 'http://localhost:3000';

const name = process.argv[2] || 'Player';
const phone = process.argv[3] || Math.floor(Math.random()*100000).toString();

const socket = io(SERVER);

socket.on('connect', () => {
  console.log(`${name} connected`, socket.id);
  socket.emit('join_quiz', { name, phone });
});

socket.on('joined_success', data => {
  console.log(`${name} joined_success`, data.participant && data.participant.id);
});

socket.on('question_started', data => {
  console.log(`${name} received question_started`, data.questionId);
  // auto answer after short delay (always pick first choice or 'A')
  setTimeout(() => {
    const selected = data.question && data.question.choices && data.question.choices[0] ? data.question.choices[0].key || 'A' : 'A';
    console.log(`${name} submitting answer ${selected}`);
    socket.emit('submit_answer', { questionId: data.questionId, selectedAnswer: selected });
  }, 1000 + Math.floor(Math.random()*1000));
});

socket.on('answer_received', data => console.log(`${name} answer_received`, data));
socket.on('question_leaderboard', data => console.log(`${name} question_leaderboard`, data && data.leaderboard && data.leaderboard.length));
socket.on('game_leaderboard', data => console.log(`${name} game_leaderboard`, data && data.leaderboard && data.leaderboard.length));

setTimeout(() => socket.close(), 20000);
