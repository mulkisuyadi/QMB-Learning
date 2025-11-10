// ==== Card selection + content update ====

// A function named updateContent runs when you click a card.
// It receives the clicked card as input.
function updateContent(card) {
  
  // Finds the nearest .tab-content container around the clicked card.
  // (This keeps updates inside the correct tab.)
  const scope = card.closest('.tab-content');
  
  // If no .tab-content exists, stop the function.
  if (!scope) return;

  // Looks for the element that shows the big Hanzi highlight.
  // If it doesn't find one inside the tab, use the global one on the page.
  const featuredHanzi =
    scope.querySelector('.featured-hanzi') ||
    document.querySelector('#featured-hanzi');

  // Try to find the example-sentence display area inside this tab.  
  let exampleSentences = scope.querySelector('.example-sentences');
  
  //If it doesn't exist, create it now.
  if (!exampleSentences) {
    
    // Creates a <div> to hold example sentences.
    exampleSentences = document.createElement('div');
    exampleSentences.className = 'example-sentences';
    
    // Fills it with default text telling the user to click a word.
    exampleSentences.innerHTML = `
      <div class="default-message">
        <p>Klik kata di bawah untuk melihat contoh kalimat</p>
        <p>Click a word below to see example sentences</p>
      </div>
    `;
    
    // Inserts the new example-sentence box right below the featured Hanzi area.
    // The parentNode property returns the parent node of an element or node.
    // ?. → Optional Chaining
    // || → OR / Fallback Value
    // ? : → Ternary / Short If
    (featuredHanzi?.parentNode || scope).insertBefore(
      exampleSentences,
      featuredHanzi ? featuredHanzi.nextSibling : null
    );
  }

  // If for some reason those display elements still don’t exist, stop.
  if (!featuredHanzi || !exampleSentences) return;
  
  // Read all learning data from the clicked card:
  // Hanzi text
  // Pinyin
  // English translation
  // Audio file link
  // Example sentences (stored as JSON)
  // If any are missing, use an empty string.
  const hanzi = card.dataset.hanzi || "";
  const pinyin = card.dataset.pinyin || "";
  const translation = card.dataset.translation || "";
  const audio = card.dataset.audio || "";
  const sentences = JSON.parse(card.dataset.sentences || "[]");

  // Updates the big Hanzi display with the clicked card’s info.
  // Also adds a play button to listen to pronunciation.
  featuredHanzi.innerHTML = `
    <div class="hanzi-display">${hanzi || "—"}</div>
    <div class="pinyin">${pinyin || ""}</div>
    <div class="translation">${translation || ""}</div>
    <div class="audio-player">
      <button onclick="playAudio('${audio}')">
        <i class="fas fa-play"></i> Play Audio
      </button>
      <span>Click to listen</span>
    </div>
  `;

  // Marks the section as containing real data (not empty state).
  exampleSentences.classList.add("has-content");
  // If sentences exist…
  exampleSentences.innerHTML = sentences.length
  // → Build one sentence card per example sentence, including:
    // Hanzi
    // Pinyin
    // Translation
    // Play audio button or “No audio”
  ? sentences.map(s => `
      <div class="sentence-card">
        <div class="sentence-hanzi">${s.hanzi || ""}</div>
        <div class="sentence-pinyin">${s.pinyin || ""}</div>
        <div class="sentence-translation">${s.translation || ""}</div>
        <div class="sentence-audio">
          <button class="audio-btn-small" 
                  ${s.audio ? `onclick="playAudio('${s.audio}')"` : "disabled"}>
            <i class="fas fa-play"></i>
          </button>
          ${!s.audio ? "<span class='no-audio'>No audio</span>" : ""}
        </div>
      </div>
    `).join("") //Stick everything together with no glue (no comma lol)

  // → Otherwise, show text saying “No example sentences.”  
  : `<div class="default-message"><p>Tidak ada contoh kalimat.</p></div>`;

  //💡 Summary
    //When a vocab card is clicked, this function:
    //Finds the correct area to update inside the tab
    //Ensures example-sentence area exists
    //Reads data from the clicked card's data- attributes
    //Displays Hanzi, pinyin, translation, audio play button
    //Shows example sentence cards (or “no example sentences” message)
  //Basically:
    //Click card → Show big Hanzi + sentence examples with audio.
}
// ==== Card selection + content update ====


// ==== Tab switching INSIDE each section ====
// NOTE: This logic runs only for sections that use the ".tab-buttons" UI pattern.
// percakapan.html uses a different layout, so this tab-switch system doesn't apply there, only for HSK1

// A function named selectCard is defined.
// It receives one parameter: card
function selectCard(card) {
  
  // Find the closest parent element that has class "tab-content".
  // If none exists, use the whole document as the search scope.
  const scope = card.closest('.tab-content') || document;

  // Inside that scope, find all elements with the class "vocab-card selected"
  // and remove the "selected" class from each one.
  scope.querySelectorAll('.vocab-card.selected')
       .forEach(c => c.classList.remove('selected'));

  // Add the "selected" class to the clicked card.
  card.classList.add('selected');

  // Smoothly scroll the clicked card into the center of the view.
  card.scrollIntoView({ behavior: "smooth", block: "center" });
}


// A function named autoSelectFirstCardIn is defined.
// It receives one parameter: container (an element that holds vocab cards)
function autoSelectFirstCardIn(container) {

  // Select the first element with class ".vocab-card" inside the container
  // (querySelector returns ONLY the first match)
  const firstCard = container.querySelector('.vocab-card');

  // If a card exists, select it and update the content display
  if (firstCard) {
    selectCard(firstCard);      // Visually highlight the selected card
    updateContent(firstCard);   // Load the card's text/audio into the preview display area
  }
}


// Find every ".tab-buttons" container on the page
document.querySelectorAll('.tab-buttons').forEach(buttonGroup => {

  // Inside each tab group, find every tab button
  buttonGroup.querySelectorAll('.tab-btn').forEach(button => {

    // When a tab button is clicked
    button.addEventListener('click', () => {

      // Find the nearest parent element with class ".content-section"
      // closest() climbs up the DOM tree until it finds the matching ancestor
      const section = button.closest('.content-section');

      // Remove "active" class from ALL tab buttons inside this section
      section.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

      // Remove "active" class from ALL tab content panes inside this section
      section.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

      // Mark the clicked tab button as active
      button.classList.add('active');

      // Read the value of data-tab="..." from the clicked button
      const tabId = button.dataset.tab;

      // Find the tab content pane whose id matches the data-tab value
      const targetPane = section.querySelector(`#${tabId}`);

      // If the pane exists, show it by adding "active"
      if (targetPane) targetPane.classList.add('active');

      // Special case: if the selected tab is "percakapan-materi"
      // auto-select the first week card inside it
      if (tabId === 'percakapan-materi') {

        // Find the currently visible .week-content
        // If none found, default to #week1
        const visibleWeek = 
          targetPane.querySelector('.week-content:not([style*="display: none"])')
          || targetPane.querySelector('#week1');

        // If a valid week section exists, auto-select the first card inside it
        // autoSelectFirstCardIn is not a JavaScript keyword or built-in command, It's just the name of a function
        if (visibleWeek) autoSelectFirstCardIn(visibleWeek);
      }
    });
  });
});
// ==== Tab switching INSIDE each section ====


// ==== Toast system ====
// A function that displays a temporary notification message (toast)
function showToast(message) {

  // Get the element with id="toast" from the page
  const toast = document.getElementById("toast");

  // Replace its text with the message we want to show
  toast.textContent = message;

  // Add the "show" class so the toast becomes visible (CSS handles animation/display)
  // The classList property returns the CSS classnames of an element.
  toast.classList.add("show");

  // After 2 seconds (2000 ms), remove the "show" class to hide the toast again
  setTimeout(() => toast.classList.remove("show"), 2000);
}
// ==== Toast system ====


document.querySelectorAll('.coming-soon').forEach(item => {
  item.addEventListener('click', () => showToast("Coming soon!"));
});


// ==== Quiz logic ====
// This section handles quiz form submissions and shows whether the user's answer is correct or wrong.

document.querySelectorAll('form[id^="quiz-"]').forEach(form => {
  // Select all <form> elements whose ID starts with "quiz-" (like quiz-1, quiz-2, etc.)
  // In CSS attribute selectors, ^= means “attribute value starts with ___”.
  // and loop through each form one by one.

  form.addEventListener('submit', e => {
    // Add an event listener for when the user submits the form (clicks "Submit" or presses Enter).

    e.preventDefault();
    // Prevent the page from reloading (which is the default behavior of forms).
    // This keeps everything happening on the same page using JavaScript.
    

    // === Read quiz data from custom data attributes ===
    const name = form.dataset.name;               // The name of the question group (used for radio inputs)
    const correctValue = form.dataset.correct;    // The correct answer value (stored in data-correct)
    const correctMsg = form.dataset.correctMsg;   // Message to display when answer is correct
    const wrongMsg = form.dataset.wrongMsg;       // Message to display when answer is wrong

    // Find the result display element associated with this specific quiz form.
    // e.g. quiz-result-1 for quiz-1
    // .split('-') This splits the string "quiz-1" into an array, using the dash - as the divider.
    // [1] This picks the second part of that array (index 1).
    const result = document.getElementById(`quiz-result-${form.id.split('-')[1]}`);

    // Find which radio button was selected for this quiz (based on its name attribute)
    // name here is a variable defined earlier. This means the name value (like "quiz1", "quiz2", etc.) comes from the form’s data-name attribute in HTML/JSON
    // input → means we’re targeting <input> elements.
    // [name="something"] → means only inputs that have a name attribute equal to "something".
    // :checked This is another CSS pseudo-class selector. It matches only inputs that are currently checked — like selected radio buttons or checked checkboxes.
    const selected = document.querySelector(`input[name="${name}"]:checked`);


    // === Check if user selected an answer ===
    if (!selected) {
      // If no radio button is selected
      result.textContent = "Please select an answer.";
      result.style.color = "orange";
      return; // Stop here (no further checking)
    }


    // === Compare selected answer with correct one ===
    if (selected.value === correctValue) {
      // If the selected answer matches the correct one
      result.textContent = correctMsg;
      result.style.color = "green";
    } else {
      // If the answer is wrong
      result.textContent = wrongMsg;
      result.style.color = "red";
    }
  });
});
// ==== Quiz logic ====


// ==== Audio ====
// A function that plays an audio file when called
// file is a parameter — a kind of temporary variable that exists only inside the function.
// Now inside the function, file = "audio/hello.mp3"
function playAudio(file) {

  // If no file path or URL is provided, stop running the function
  if (!file) return;

  // Create a new HTMLAudioElement object using the provided file path
  // Example: new Audio("sounds/hello.mp3");
  const audio = new Audio(file);

  // Start playing the audio file
  audio.play();
}
// ==== Audio ====


// Listen for any click event anywhere in the entire document (the whole webpage)
document.addEventListener('click', (e) => {

  // Find the nearest ancestor element (including the clicked element itself)
  // that has the class "vocab-card"
  // If the click didn’t happen on a vocab-card or inside one, this will be null
  const card = e.target.closest('.vocab-card');

  // If no vocab-card was found, stop the function — we don’t want to run the rest
  if (!card) return;

  // If a vocab-card *was* clicked, mark it as selected visually
  selectCard(card);

  // Then update the content area (featured Hanzi, pinyin, translation, etc.)
  // based on the data attributes stored in that vocab-card
  updateContent(card);
});


// ==== Percakapan: week switching ====
// Function to switch between different "weeks" of conversation material
function showWeek(weekId) {

  // Get the main container (pane) that holds all weekly contents
  const pane = document.getElementById('percakapan-materi');

  // If the container doesn't exist, stop the function
  if (!pane) return;

  // Hide all elements inside pane that have the class "week-content"
  // This ensures only one week's content will be shown at a time
  pane.querySelectorAll('.week-content').forEach(div => div.style.display = 'none');

  // Find the specific week's content using its ID (weekId)
  const target = pane.querySelector(`#${weekId}`);

  // If the target week exists, display it and auto-select its first vocabulary card
  if (target) {
    target.style.display = 'block';
    autoSelectFirstCardIn(target);
  }

  // Remove the "active" state from all week buttons (visual reset)
  pane.querySelectorAll('.week-buttons button').forEach(btn => btn.classList.remove('active'));

  // Find the button that corresponds to the selected week (using data-week attribute)
  const activeBtn = pane.querySelector(`.week-buttons button[data-week="${weekId}"]`);

  // If found, mark that button as active to highlight which week is currently open
  if (activeBtn) activeBtn.classList.add('active');
}
// ==== Percakapan: week switching ====


// Wait until the entire HTML document has finished loading
document.addEventListener('DOMContentLoaded', () => {

  // === Setup for Percakapan (Conversation) Section ===

  // Select all buttons inside the #percakapan-materi section that belong to .week-buttons
  const buttons = document.querySelectorAll('#percakapan-materi .week-buttons button');

  // For each week button, attach a click event listener
  buttons.forEach(button => {

    // When clicked, call showWeek() using the week number stored in the button's data-week attribute
    // Example: if <button data-week="week2">, then showWeek('week2') is executed
    button.addEventListener('click', () => showWeek(button.dataset.week));
  });

  // When the page loads for the first time, automatically show Week 1
  showWeek('week1');


  // === Setup for HSK Vocabulary Section ===

  // Try to find a default vocab card with data-hanzi="我" (the character "wǒ" - "I, me")
  // If not found, just select the first vocab-card available in the HSK1 section
  const defaultHSKCard =
    document.querySelector('#hsk1-materi .vocab-card[data-hanzi="我"]')
    || document.querySelector('#hsk1-materi .vocab-card');

  // If a vocab card is found, make it the active one and update its displayed info
  if (defaultHSKCard) {
    selectCard(defaultHSKCard);
    updateContent(defaultHSKCard);
  }
});



// ==== ✅ Unified vocab renderer ====
// This function dynamically creates and displays vocab cards on the page.
function renderVocabCards(items, gridSelector) {

  // Find the container (grid) where the vocab cards should be placed
  const grid = document.querySelector(gridSelector);
  if (!grid) return; // If the container is not found, stop the function

  // Clear any existing cards inside the grid
  grid.innerHTML = "";

  // Loop through each vocabulary item (object) from the "items" array
  items.forEach(v => {

    // Create a new <div> element for the vocab card
    const div = document.createElement("div");
    div.className = "vocab-card"; // Give it the class for styling and event handling

    // Prepare example sentences for this vocab (if available)
    // Normalize the data so all sentences follow the same format
    const sentences = (v.sentences || []).map(s => ({
      hanzi: s.hanzi || s.cn || "",
      pinyin: s.pinyin || "",
      translation: s.translation || s.id || "",
      audio: s.audio || ""
    }));

    // Store vocabulary data in custom HTML5 data attributes
    // (so they can be easily accessed later with JS)
    div.dataset.hanzi = v.hanzi || "";
    div.dataset.pinyin = v.pinyin || "";
    div.dataset.translation = v.translation || v.arti || "";
    div.dataset.audio = v.audio || "";
    div.dataset.sentences = JSON.stringify(sentences); // Save sentences as JSON string

    // Define the visual structure of the card
    // (What the user will see)
    div.innerHTML = `
      <p class="hanzi">${v.hanzi || ""}</p>
      <p class="pinyin">${v.pinyin || ""}</p>
      <p class="translation">${v.translation || v.arti || ""}</p>
    `;

    // Add the completed vocab card to the grid container
    grid.appendChild(div);
  });

  // Automatically select the first card in the grid (if any cards exist)
  if (grid.children.length) autoSelectFirstCardIn(grid);
}
// ==== ✅ Unified vocab renderer ====


// === Load vocab.json (HSK1 Materi) ===
// Fetch the vocabulary data file for HSK1
fetch("static/data/vocab.json")
  // Convert the response into JSON format
  .then(res => res.json())
  // Once data is loaded, render the vocab cards into the HSK1 section
  .then(data => renderVocabCards(data.hsk1 || [], "#hsk1-materi .vocab-grid"))
  // If an error happens (e.g. file missing or corrupted), log it
  .catch(err => console.error("Failed to load data/vocab.json:", err));


// === Load weeks.json (Percakapan Materi) ===
// Fetch the conversation data, which contains multiple “weeks”
fetch("static/data/weeks.json")
  .then(res => res.json()) // Convert the response to JSON
  .then(data => {
    // If there’s no "weeks" key, exit early
    if (!data.weeks) return;

    // Loop through every week (e.g., week1, week2, week3, etc.)
    for (const week in data.weeks) {
      // Find the container element for that week’s vocabulary
      const container = document.querySelector(`#${week} .vocab-container`);
      if (!container) continue; // Skip if no container found in HTML
      container.innerHTML = ""; // Clear existing content

      // Loop through every vocab item in this week’s list
      data.weeks[week].forEach(v => {
        // Create a vocab card for each item
        const div = document.createElement("div");
        div.className = "vocab-card";

        // Prepare example sentences (normalize their structure)
        const sentences = (v.sentences || []).map(s => ({
          hanzi: s.hanzi || s.cn || "",
          pinyin: s.pinyin || "",
          translation: s.translation || s.id || "",
          audio: s.audio || ""
        }));

        // Store vocab data as dataset attributes for easy access later
        div.dataset.hanzi = v.hanzi || "";
        div.dataset.pinyin = v.pinyin || "";
        div.dataset.translation = (v.translation || v.arti || "");
        div.dataset.audio = v.audio || "";
        div.dataset.sentences = JSON.stringify(sentences);

        // Define how the card looks visually
        div.innerHTML = `
          <p class="hanzi">${v.hanzi || ""}</p>
          <p class="pinyin">${v.pinyin || ""}</p>
          <p class="translation">${v.translation || v.arti || ""}</p>
        `;

        // Add this card to the container for the current week
        container.appendChild(div);
      });
    }

    // ✅ Once all weeks have been loaded and rendered,
    // attach click listeners to the week buttons for navigation
    const buttons = document.querySelectorAll('#percakapan-materi .week-buttons button');
    buttons.forEach(button => {
      // When a button is clicked, show that specific week’s content
      button.addEventListener('click', () => showWeek(button.dataset.week));
    });

    // ✅ By default, show Week 1 immediately when page loads
    showWeek('week1');
  })
  // If anything fails during the process, log the error
  .catch(err => console.error("Failed to load data/weeks.json:", err));
// === Load weeks.json (Percakapan Materi) ===


// === Render story + quizzes from JSON ===
async function loadQuizzes() {
  try {
    // 1️⃣ Fetch the quizzes.json file from your static folder
    const res = await fetch("static/data/quizzes.json");

    // 2️⃣ Convert the fetched response into a JavaScript object
    const data = await res.json();

    // 3️⃣ Find the main container where all story + quiz content will go
    const container = document.getElementById("hsk1-membaca");
    container.innerHTML = ""; // Clear any previous content

    // 4️⃣ If a "story" section exists in the JSON, display it first
    if (data.story) {
      // Create a title heading (like “Latihan Membaca”)
      const storyTitle = document.createElement("h3");
      storyTitle.textContent = "Latihan Membaca";
      container.appendChild(storyTitle);

      // Create a sub-heading showing the story’s title
      const storyHeading = document.createElement("p");
      storyHeading.innerHTML = `<strong>${data.story.title}</strong>`;
      container.appendChild(storyHeading);

      // Loop through every paragraph line in the story
      data.story.content.forEach(line => {
        const p = document.createElement("p");
        p.textContent = line;
        container.appendChild(p);
      });

      // Add a header for the quiz questions below the story
      const questionHeader = document.createElement("h4");
      questionHeader.textContent = "Pertanyaan:";
      container.appendChild(questionHeader);
    }

    // 5️⃣ If there’s an HSK1 quiz array in the data, render each quiz
    if (data.hsk1 && Array.isArray(data.hsk1)) {
      data.hsk1.forEach(q => {
        // Create a <form> element for this quiz question
        const form = document.createElement("form");
        form.classList.add("quiz-form");

        // The inner HTML contains:
        // - The question text
        // - The multiple choice options
        // - A submit button
        // - A feedback area
        form.innerHTML = `
          <p>${q.question}</p>
          ${q.options.map(opt => `
            <label>
              <input type="radio" name="${q.id}" value="${opt.value}">
              ${opt.label}
            </label><br>
          `).join("")}
          <button type="submit">提交</button>
          <div class="feedback"></div>
        `;

        // Add event listener for when the form is submitted
        form.addEventListener("submit", e => {
          e.preventDefault(); // Prevent the page from refreshing

          // Get whichever radio button was selected
          const selected = form.querySelector("input[type=radio]:checked");
          const feedback = form.querySelector(".feedback");

          // If user didn’t select anything, warn them
          if (!selected) {
            feedback.textContent = "⚠️ 请选择一个答案";
            feedback.style.color = "orange";
            return;
          }

          // Compare selected answer to the correct one from the JSON
          if (selected.value === q.correct) {
            feedback.textContent = q.correctMsg; // success message
            feedback.style.color = "green";
          } else {
            feedback.textContent = q.wrongMsg; // failure message
            feedback.style.color = "red";
          }
        });

        // Finally, attach this quiz form to the container
        container.appendChild(form);
      });
    }
  } catch (err) {
    // 6️⃣ If something goes wrong, show an error in console (in Chinese: “Failed to load quiz”)
    console.error("加载测验失败:", err);
  }
}

// 7️⃣ Run the function as soon as the script is loaded
loadQuizzes();
// === Render story + quizzes from JSON ===


// === TEST LOGIC == //
const allTests = {
  "Math Quiz 1": [
    { question: " 2 + 2 = ?", options: ["3", "4", "5"], correct: "4" },
    { question: " 10 ÷ 2 = ?", options: ["2", "5", "10"], correct: "5" }
  ],
  "English Quiz 2": [
    { question: "Which one is carnivore?", options: ["Elephant", "Deer", "Monkey", "Tiger"], correct: "Tiger" },
    { question: "Which one is herbivore?", options: ["Girraffe", "Lion", "Tiger", "Monkey"], correct: "Girraffe" }
  ],
  "Science Quiz 3": [
    { question: "Water boils at?", options: ["50°C", "75°C", "100°C"], correct: "100°C" }
  ],
  "HSK1 阅读测验": [ 
    { question: "王明在哪里工作？", options: ["青美邦", "青山", "美国"], correct: "QMB" }, 
    { question: "王明多大了？", options: ["十二岁", "十三岁", "二十五岁"], correct: "25_tahun" }, 
    { question: "王明是中国人吗？", options: ["是", "不", "我不知道"], correct: "I don't know" }, 
    { question: "王明每天几点来公司？", options: ["七点", "八点", "九点"], correct: "8_dian" }, 
    { question: "王明早上喝什么？", options: ["茶", "咖啡", "牛奶"], correct: "kafei" }, 
    { question: "王明下午做什么？", options: ["写字", "开会", "吃饭"], correct: "kai_hui" }, 
    { question: "王明几点回家？", options: ["五点", "六点", "七点"], correct: "6_dian" }, 
    { question: "王明觉得今天怎么样？", options: ["很好", "不好", "马马虎虎"], correct: "hen_hao" }, 
    { question: "王明早上在做什么？", options: ["喝茶，和同事说话", "开会", "开始工作"], correct: "喝茶说话" }, 
    { question: "为什么王明喜欢他的工作？", options: ["因为同事很好", "因为工资高", "因为工作容易"], correct: "同事很好" }, 
    { question: "王明和谁一起吃饭？", options: ["同事", "朋友", "家人"], correct: "同事" } 
  ]
};


// === Grab references to key DOM elements ===
const testSelect = document.getElementById("test_name");  // Dropdown <select> for choosing a quiz/test
const container = document.getElementById("quiz-container"); // The main area where quiz questions will appear


// === Function to render the quiz dynamically ===
function loadQuiz() {
  // 1️⃣ Get which test is currently selected
  const selectedTest = testSelect.value;

  // 2️⃣ Retrieve its quiz data from the global variable 'allTests'
  const quizData = allTests[selectedTest];
  console.log(selectedTest, quizData); // For debugging — see what test and data were loaded

  // 3️⃣ If no quiz data exists for the selected test, stop
  if (!quizData) return;

  // 4️⃣ Clear any previously rendered questions
  container.innerHTML = "";

  // 5️⃣ Loop through every question in the quiz
  quizData.forEach((q, index) => {
    const qId = `q${index + 1}`; // e.g. "q1", "q2", "q3"

    // Create a <h2> for the question text
    const h2 = document.createElement("h2");
    h2.textContent = `${index + 1}. ${q.question}`;
    container.appendChild(h2);

    // Create an unordered list (<ul>) to hold the answer options
    const ul = document.createElement("ul");
    ul.dataset.question = index + 1; // store question number
    ul.style.display = "grid";
    ul.style.gap = "10px";

    // Create each option as a <label> containing a radio button
    q.options.forEach(opt => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="radio" name="${qId}" value="${opt}">${opt}`;
      ul.appendChild(label);
    });

    // Add the list of options under the question
    container.appendChild(ul);
  });

  // 6️⃣ Create an object mapping each question ID to its correct answer
  // Example: { q1: "A", q2: "C", q3: "B" }
  const correctAnswers = Object.fromEntries(
    quizData.map((q, i) => [`q${i + 1}`, q.correct]),
  );

  // 7️⃣ When the user clicks the "Submit" button, calculate the score
  document.getElementById("submit").addEventListener("click", () => {
    const total = quizData.length;        // Total number of questions
    const points = 100 / total;           // Each question’s score value
    let score = 0;                        // Starting score

    // Loop through each question
    Object.keys(correctAnswers).forEach(id => {
      // Find the selected answer for this question
      const selected = document.querySelector(`input[name="${id}"]:checked`);
      // If an answer was selected and it’s correct, add points
      if (selected && selected.value === correctAnswers[id]) {
        score += parseFloat(points.toFixed(2));
      }
    });

    // 8️⃣ Update the score in both hidden input and visible text
    document.getElementById("scoreInput").value = score;
    document.getElementById("scoreDisplay").textContent = `Your score: ${score}/100`;
  });
}


// === Event Listeners ===

// 🔹 Reload the quiz whenever the dropdown value changes
testSelect.addEventListener("change", loadQuiz);

// 🔹 Automatically load a default quiz when the page first loads
document.addEventListener("DOMContentLoaded", loadQuiz);


// === Extra: Toast notification when saving ===
document.querySelectorAll('button[type="submit"][id="submit"]').forEach(item => {
  item.addEventListener('click', () => showToast("Progress saved successfully"));
});



// === Get reference to an element named <featured-hanzi> ===
// This line looks for a custom HTML tag called <featured-hanzi>
// (If your page doesn't have such a tag, this will return null)
const sectiontest1 = document.querySelector("featured-hanzi");


// === Just a plain string variable ===
// This stores the text "test" inside the variable sectiontest4
// (It’s not a DOM element — just a normal string)
const sectiontest4 = "test";


// === Get the first element with the class "button" ===
// For example, if your HTML has <div class="button">Click</div>,
// this will store a reference to that element
const sectiontest2 = document.querySelector(".button");


// === Get the first element with the class "pinyin" ===
// Useful if you want to manipulate or read text inside <p class="pinyin">你好</p>
const sectiontest3 = document.querySelector(".pinyin");


// === Log one of the variables to the browser console ===
// This prints the value of sectiontest4 ("test") to check or debug it
console.log(sectiontest4);
