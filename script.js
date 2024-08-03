document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    const pages = document.querySelectorAll('.page-content');
    const soundItems = document.querySelectorAll('.sound-item img');
    const volumeSliders = document.querySelectorAll('.volume-slider');
    const audioElements = {};
    
    // Page switching
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPage = item.getAttribute('data-page');
            
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            pages.forEach(page => {
                if (page.id === `${targetPage}-page`) {
                    page.classList.add('active');
                } else {
                    page.classList.remove('active');
                }
            });
        });
    });

    // Sound effects
    soundItems.forEach((item, index) => {
        const soundFile = item.dataset.sound;
        audioElements[soundFile] = new Audio(soundFile);
        audioElements[soundFile].loop = true;

        item.addEventListener('click', () => {
            if (audioElements[soundFile].paused) {
                audioElements[soundFile].play();
                item.style.opacity = 1;
            } else {
                audioElements[soundFile].pause();
                item.style.opacity = 0.7;
            }
        });

        volumeSliders[index].addEventListener('input', (e) => {
            audioElements[soundFile].volume = e.target.value;
        });
    });

    // Pomodoro Timer
    let timer;
    let timeLeft;
    const timerDisplay = document.querySelector('.timer-display');
    const startButton = document.getElementById('startTimer');
    const resetButton = document.getElementById('resetTimer');
    const timerModes = document.querySelectorAll('.timer-mode');
    const pomodoroInput = document.getElementById('pomodoroTime');
    const shortBreakInput = document.getElementById('shortBreakTime');
    const longBreakInput = document.getElementById('longBreakTime');
    
    const timerSound = new Audio('path-to-your-timer-sound.mp3'); // Replace with your sound file path
    
    const timerDurations = {
        pomodoro: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60
    };
    
    let currentMode = 'pomodoro';

    function updateTimerDisplay(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function startTimer() {
        if (timer) clearInterval(timer);
        timeLeft = timerDurations[currentMode];
        updateTimerDisplay(timeLeft);
        
        timer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay(timeLeft);
            if (timeLeft === 0) {
                clearInterval(timer);
                timerSound.play();
                alert('Timer finished!');
                startButton.textContent = 'Start';
            }
        }, 1000);
        
        startButton.textContent = 'Pause';
    }

    function resetTimer() {
        clearInterval(timer);
        timeLeft = timerDurations[currentMode];
        updateTimerDisplay(timeLeft);
        startButton.textContent = 'Start';
    }

    function updateTimerDuration(mode, minutes) {
        timerDurations[mode] = minutes * 60;
        if (currentMode === mode) {
            resetTimer();
        }
    }

    startButton.addEventListener('click', () => {
        if (startButton.textContent === 'Start') {
            startTimer();
        } else {
            clearInterval(timer);
            startButton.textContent = 'Start';
        }
    });

    resetButton.addEventListener('click', resetTimer);

    timerModes.forEach(mode => {
        mode.addEventListener('click', () => {
            timerModes.forEach(m => m.classList.remove('active'));
            mode.classList.add('active');
            currentMode = mode.dataset.mode;
            resetTimer();
        });
    });

    pomodoroInput.addEventListener('change', () => updateTimerDuration('pomodoro', pomodoroInput.value));
    shortBreakInput.addEventListener('change', () => updateTimerDuration('shortBreak', shortBreakInput.value));
    longBreakInput.addEventListener('change', () => updateTimerDuration('longBreak', longBreakInput.value));

    // Initialize the timer display
    updateTimerDisplay(timerDurations.pomodoro);

    // Task Tracker
    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('taskList');

    // Load saved tasks
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach((task, index) => {
            addTaskToDOM(task, index);
        });
    }

    function addTaskToDOM(task, index) {
        const row = document.createElement('tr');
        row.setAttribute('data-urgency', determineUrgency(task.deadline));
        row.innerHTML = `
            <td><input type="checkbox" ${task.done ? 'checked' : ''}></td>
            <td>${task.name}</td>
            <td>${task.subject}</td>
            <td>${task.deadline}</td>
        `;
        const checkbox = row.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
            tasks[index].done = checkbox.checked;
            if (checkbox.checked) {
                setTimeout(() => {
                    tasks.splice(index, 1);
                    saveTasks();
                    renderTasks();
                }, 500);
            } else {
                saveTasks();
            }
        });
        taskList.appendChild(row);
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function determineUrgency(deadline) {
        const deadlineDate = new Date(deadline);
        const today = new Date();
        const diffTime = Math.abs(deadlineDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 2) return 'high';
        if (diffDays <= 7) return 'medium';
        return 'low';
    }

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskName = document.getElementById('taskName').value;
        const taskSubject = document.getElementById('taskSubject').value;
        const taskDeadline = document.getElementById('taskDeadline').value;
        tasks.push({ name: taskName, subject: taskSubject, deadline: taskDeadline, done: false });
        saveTasks();
        renderTasks();
        taskForm.reset();
    });

    // Initial render
    renderTasks();

    // Notification for unchecked tasks
    function checkUncheckedTasks() {
        const now = new Date();
        tasks.forEach((task, index) => {
            if (!task.done && !task.notified) {
                const taskDate = new Date(task.deadline);
                const timeDiff = now - taskDate;
                if (timeDiff >= 2.5 * 60 * 60 * 1000) { // 2.5 hours in milliseconds
                    notifyTask(task);
                    tasks[index].notified = true;
                    saveTasks();
                }
            }
        });
    }

    function notifyTask(task) {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    const notification = new Notification('Task Reminder', {
                        body: `Ano na, gawin mo na yung "${task.name}" mo!`,
                        icon: 'animals.png' // Replace with your icon path
                    });
                    
                    // Play sound
                    const audio = new Audio('notiication.mp3'); // Replace with your sound file path
                    audio.play();
                }
            });
        }
    }

    // Check for unchecked tasks every minute
    setInterval(checkUncheckedTasks, 60000);

    // Load saved note
    const todayNote = document.getElementById('todayNote');
    todayNote.value = localStorage.getItem('todayNote') || '';
    
    // Save note on input
    todayNote.addEventListener('input', () => {
        localStorage.setItem('todayNote', todayNote.value);
    });

    // Tool Box
    const linkForm = document.getElementById('linkForm');
    const linkList = document.getElementById('linkList');
    
    // Load saved links
    const savedLinks = JSON.parse(localStorage.getItem('toolBoxLinks')) || [];
    savedLinks.forEach(link => addLink(link.name, link.url));

    linkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const linkName = document.getElementById('linkName').value;
        const linkUrl = document.getElementById('linkUrl').value;
        addLink(linkName, linkUrl);
        saveLinks();
        linkForm.reset();
    });

    function addLink(name, url) {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${url}" target="_blank">${name}</a>`;
        linkList.appendChild(li);
    }

    function saveLinks() {
        const links = Array.from(linkList.children).map(li => ({
            name: li.textContent,
            url: li.querySelector('a').href
        }));
        localStorage.setItem('toolBoxLinks', JSON.stringify(links));
    }
    
        // Quote functionality
        const quoteText = document.getElementById('quote-text');
        let quotes = [
          "Believe in yourself, baby!",
          "You're doing great hehehe!",
          "Keep pushing forward!",
          "You've got this po!",
          "Time will tell you how much I really love you and show you how I feel.",
          "You might not think highly of yourself. I wish you could borrow my eyes to show you what a beautiful person you are.",
          "Matter occupies space, but here in my heart, you have a special place.",
          "I'll always wish you the best, even if we aren't at our best.",
          "To tell you honestly, I really love your eyes.",
          "Being with you feels like home. I can be myself when I'm with you. You're the place that I'll always run to, and I love the feeling of being with you.",
          "You may not be perfect, but you are perfect just for me.",
          "I'm hoping that one day we'll both be successful and achieve our dreams together.",
          "Sa mundong maraming bitwin, sa'yo pa rin ako darating.",
          "Life may not be good to you all the time. But remember that there's a guy who wish you nothing but the best. That's me :>",
          "You are my world, my piece, my solace, and my happiness. You are everything I could ever ask for.",
          "You are always beautiful. As long as I'm alive, you are beautiful.",
          "I always like staring at the sea. It feels so calming, as if I'm at peace. That's how I see you when I look at you.",
          "Life is short. I want to spend it with you.",
          "You're more than enough for me.",
          "Maybe it's your face, maybe it's your eyes, maybe it",
          "MHEGAN, apat na letra ngunit apat lamang ang gusto ko at ayun ay IKAW",
          "I'm always here for you, no matter what pain you're going through.",
          "Ang nais ko lang ay maging masaya ka. Iyon lamang at wala nang iba. I'll always wish you the best, Lalove.",
          "Just a small glance of you makes my day.","I love you so much",
          "I'm so lucky to have you. That's why please take care of yourself, because you are my treasure.","Ang cute mo heheheh",
          "I really like your smile.","Ang ganda mo araw araw","Mapagod man ako sayo, ikaw parin ang pahinga at babalikan ko.",
          "You got this!! Whatever you want to achieve is also my wish :>",
          "I hate it when you're crying because you're not okay. Please be strong. I know you can go through this.",
          "I don't fix problems. I fix my thinking.","You're fine the way you are… and there's always room for improvement.",
          "Answers won't come up unless you get enough reasons.",
          "You can't stop your thoughts, but you don't have to listen to them, either.",
          "Habits make you or break you. We become what we repeatedly do. Building good habits, deals with your discipline.",
          "What you see, is what you get. What you see about yourself and others is what you will make true about yourself.",
          "Our confidence needs to come from within, not from without.",
          "Confidence is just the same as being comfortable. It is comfortable to be your best.",
          "Private victories always come before public victories.",
          "There was never anything to be afraid of.",
          "The only thing holding you back from getting whatever you desire is yourself.",
          "It's not about what happens in your life, it's what you do about it,",
          "Take initiative to make it happen",

        ];
      
        function typeWriter(text, i = 0) {
          if (i < text.length) {
            quoteText.innerHTML += text.charAt(i);
            i++;
            setTimeout(() => typeWriter(text, i), 100);
          }
        }
      
        function displayRandomQuote() {
          const quote = quotes[Math.floor(Math.random() * quotes.length)];
          quoteText.innerHTML = '';
          typeWriter(quote);
        }
      
        // Display initial greeting
        typeWriter("Hi babyy! I love youu :>");
      
        // Update quote every 8 minutes
        setInterval(displayRandomQuote, 3 * 60 * 1000);
     
        const popup = document.getElementById('password-popup');
        const passwordInput = document.getElementById('password-input');
        const submitButton = document.getElementById('submit-password');
        const playButton = document.getElementById('play-audio');
        const audio = new Audio('record/mew.mp3'); // Replace with your audio file path
      
        // Show popup when page loads
        popup.style.display = 'flex';
      
        function stopAudio() {
          audio.pause();
          audio.currentTime = 0; // This resets the audio to the beginning
        }
      
        // Password check (click)
        submitButton.addEventListener('click', () => {
          if (passwordInput.value === 'mahal kita') { // Replace with your chosen password
            popup.style.display = 'none';
            stopAudio(); // Stop the audio when correct password is entered
          } else {
            alert('Hala malii. Try again, baby!');
          }
        });
      
        // Password check (Enter key)
        passwordInput.addEventListener('keyup', (event) => {
          if (event.key === 'Enter') {
            if (passwordInput.value === 'mahal kita') { // Replace with your chosen password
              popup.style.display = 'none';
              stopAudio(); // Stop the audio when correct password is entered
            } else {
              alert('Hala malii. Try again, baby!');
            }
          }
        });
      
        // Play audio button
        playButton.addEventListener('click', () => {
          audio.play().catch(error => console.log("Audio playback failed:", error));
        });
      
        // Autoplay audio when popup shows (uncomment if you want this feature)
        // audio.play().catch(error => console.log("Audio autoplay failed:", error));
       
        const mediaUpload = document.getElementById('media-upload');
        const mediaPreview = document.getElementById('media-preview');
        const removeMediaButton = document.getElementById('remove-media');
        const uploadIcon = document.getElementById('upload-icon');
      
        function saveMedia(file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            localStorage.setItem('uploadedMedia', e.target.result);
            localStorage.setItem('uploadedMediaType', file.type);
            displayMedia(e.target.result, file.type);
          };
          reader.readAsDataURL(file);
        }
      
        function displayMedia(src, type) {
          mediaPreview.innerHTML = ''; // Clear existing content
          uploadIcon.style.display = 'none'; // Hide the upload icon
      
          if (type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = src;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.style.objectFit = 'contain';
            mediaPreview.appendChild(img);
          } else if (type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = src;
            video.controls = true;
            video.style.maxWidth = '100%';
            video.style.maxHeight = '100%';
            video.style.objectFit = 'contain';
            mediaPreview.appendChild(video);
          }
      
          removeMediaButton.style.display = 'block';
        }
      
        // Load media from localStorage on page load
        const savedMedia = localStorage.getItem('uploadedMedia');
        const savedMediaType = localStorage.getItem('uploadedMediaType');
        if (savedMedia && savedMediaType) {
          displayMedia(savedMedia, savedMediaType);
        } else {
          uploadIcon.style.display = 'block';
        }
      
        mediaUpload.addEventListener('change', (event) => {
          const file = event.target.files[0];
          if (file) {
            saveMedia(file);
          }
        });
      
        removeMediaButton.addEventListener('click', () => {
          localStorage.removeItem('uploadedMedia');
          localStorage.removeItem('uploadedMediaType');
          mediaPreview.innerHTML = '';
          removeMediaButton.style.display = 'none';
          uploadIcon.style.display = 'block';
        });
});