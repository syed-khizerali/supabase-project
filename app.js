



const SUPABASE_URL = "https://tofbqbjplmudrvfjvivk.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZmJxYmpwbG11ZHJ2Zmp2aXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTgxNjgsImV4cCI6MjA3MjU5NDE2OH0.iaelpKNM0V4gpedmtHknIVJXfbdYvaPceWczeyN6pBQ";
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const authDiv = document.getElementById("auth");
const appDiv = document.getElementById("app");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");

const userEmailSpan = document.getElementById("userEmail");
const newTodoInput = document.getElementById("newTodo");
const addTodoBtn = document.getElementById("addTodoBtn");
const todoList = document.getElementById("todoList");

const avatarImg = document.getElementById("avatar");
const avatarUpload = document.getElementById("avatarUpload");
const uploadBtn = document.getElementById("uploadBtn");

// --- AUTH HANDLERS ---
loginBtn.onclick = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailInput.value,
    password: passwordInput.value,
  });
  if (error) return alert(error.message);
  loadApp();
};

signupBtn.onclick = async () => {
  const { data, error } = await supabase.auth.signUp({
    email: emailInput.value,
    password: passwordInput.value,
  });
  if (error) return alert(error.message);
  alert("Check your email for confirmation!");
};

logoutBtn.onclick = async () => {
  await supabase.auth.signOut();
  authDiv.classList.remove("hidden");
  appDiv.classList.add("hidden");
};

async function loadTodos(user) {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("user_id", user.id)
    .order("id", { ascending: false });

  if (error) return console.error(error);

  todoList.innerHTML = "";
  data.forEach((todo) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span style="text-decoration:${todo.completed ? "line-through" : "none"}">
        ${todo.task}
      </span>
      <div>
        <button onclick="toggleTodo(${todo.id}, ${!todo.completed})">✔</button>
        <button onclick="deleteTodo(${todo.id})">❌</button>
      </div>
    `;
    todoList.appendChild(li);
  });
}

addTodoBtn.onclick = async () => {
  const user = (await supabase.auth.getUser()).data.user;
  const { error } = await supabase.from("todos").insert([
    { task: newTodoInput.value, user_id: user.id, completed: false },
  ]);
  if (error) return console.error(error);
  newTodoInput.value = "";
  loadTodos(user);
};

async function toggleTodo(id, completed) {
  await supabase.from("todos").update({ completed }).eq("id", id);
  const user = (await supabase.auth.getUser()).data.user;
  loadTodos(user);
}

async function deleteTodo(id) {
  await supabase.from("todos").delete().eq("id", id);
  const user = (await supabase.auth.getUser()).data.user;
  loadTodos(user);
}

uploadBtn.onclick = async () => {
  const file = avatarUpload.files[0];
  if (!file) return alert("Please select a file first!");

  const user = (await supabase.auth.getUser()).data.user;
  const filePath = `${user.id}/${file.name}`;

  let { error } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });
  if (error) return alert(error.message);

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
  avatarImg.src = data.publicUrl;

  await supabase.from("profiles").upsert({ id: user.id, avatar_url: data.publicUrl });
};

async function loadApp() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;
  userEmailSpan.textContent = user.email;
  authDiv.classList.add("hidden");
  appDiv.classList.remove("hidden");

  loadTodos(user);

  const { data } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single();
  if (data?.avatar_url) avatarImg.src = data.avatar_url;
}

supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) loadApp();
});
