// login.js
import '../scss/login.scss';
import 'bootstrap';

function checkPasswordStrength() {
    const passwordInput = document.getElementById("password");
    const strengthIndicator = document.getElementById("password-strength");
    const password = passwordInput.value;

    let strength = 0;

    // 根据密码复杂性评分
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    // 更新强度指示器
    switch (strength) {
        case 0:
        case 1:
            strengthIndicator.textContent = "弱";
            strengthIndicator.style.color = "red";
            break;
        case 2:
            strengthIndicator.textContent = "适中";
            strengthIndicator.style.color = "orange";
            break;
        case 3:
        case 4:
            strengthIndicator.textContent = "良好";
            strengthIndicator.style.color = "green";
            break;
    }
}

// 检查密码是否匹配
function checkPasswordMatch() {
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const matchIndicator = document.getElementById("password-match");

    if (confirmPasswordInput.value === "") {
        matchIndicator.textContent = ""; // 清空指示
        return;
    }

    if (confirmPasswordInput.value === passwordInput.value) {
        matchIndicator.textContent = "✅";
        matchIndicator.style.color = "green";
    } else {
        matchIndicator.textContent = "❌";
        matchIndicator.style.color = "red";
    }
}

if (window.location.pathname.endsWith("register.html")) {
    document.addEventListener("DOMContentLoaded", () => {
        const passwordInput = document.getElementById("password");
        const confirmPasswordInput = document.getElementById("confirmPassword");

        // 监听密码输入事件，实时检查密码强度
        passwordInput.addEventListener("input", checkPasswordStrength);

        // 监听确认密码输入事件，实时检查密码是否匹配
        confirmPasswordInput.addEventListener("input", checkPasswordMatch);
    });
}


//传输注册数据
if (window.location.pathname.endsWith("register.html")) {
    document.getElementById('registerForm').addEventListener('submit', async function (e) {
        e.preventDefault(); // 防止默认提交表单行为

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('confirmPassword').value.trim();

        if (!username || !password) {
            alert('用户名或密码不能为空！');
            return;
        }

        const formData = new URLSearchParams();
        formData.append('user_name', username);
        formData.append('password', password);

        try {
            const response = await fetch('http://api.demo.joking7.com:8081/user/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            const data = await response.json();
            if (response.ok) {
                alert('注册成功！');
            } else {
                alert(`注册失败: ${data.msg || '未知错误'}`);
            }
        } catch (error) {
            console.error('请求失败:', error);
            alert('无法连接到服务器。');
        }
    });
}


if (window.location.pathname.endsWith("login.html")) {
    document.getElementById('loginForm').addEventListener('submit', async function (e) {
        e.preventDefault(); // 阻止表单的默认提交行为

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        // 前端校验
        if (!username || !password) {
            alert('用户名和密码不能为空！');
            return;
        }

        const formData = new URLSearchParams();
        formData.append('user_name', username);
        formData.append('password', password);

        try {
            const response = await fetch('http://api.demo.joking7.com:8081/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            const data = await response.json(); // 解析 JSON 响应
            if (response.ok && data.code === 200) {
                alert('登录成功！');
                const jwToken = data.data;
                if (jwToken) {
                    localStorage.setItem('JWToken', jwToken); // 存储到 localStorage
                } else {
                    alert('响应头中未包含 JWToken');
                }
                // 跳转到指定 URL
                window.location.href = document.querySelector('.btn.sign-in').getAttribute('href');
            } else {
                alert(`登录失败: ${data.msg || '未知错误'}`);
            }
        } catch (error) {
            console.error('请求失败:', error);
            alert('无法连接到服务器，请稍后重试。');
        }
    });
}

// 定义一个函数以从后端获取用户信息
async function fetchUserProfile() {
    try {
        // 获取 JWT Token（假设存储在 localStorage 中）
        const token = localStorage.getItem('JWToken');
        if (!token) {
            alert('未找到登录信息，请重新登录！');
            return;
        }

        // 调用后端接口
        const response = await fetch('http://api.demo.joking7.com:8081/user/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'JWToken': token,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // 解析响应数据
        const result = await response.json();
        if (result.code === 200) {
            const user = result.data;
            console.log(result.data);
            populateUserForm(user); // 调用表单填充函数
        } else {
            alert(`获取用户信息失败: ${result.msg}`);
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        alert('获取用户信息时发生错误，请稍后再试。');
    }
}

// 定义一个函数用于将数据填充到表单中
function populateUserForm(user) {
    // 设置用户名
    const usernameInput = document.getElementById('username');
    if (usernameInput) usernameInput.value = user.user_name;

    // 设置分数
    const userScoreInput = document.getElementById('userScore');
    if (userScoreInput) userScoreInput.value = user.score || 'N/A';
    const token = localStorage.getItem("JWToken");
    console.log(token);
}

// 定义一个函数以更新用户信息
async function updateUserProfile() {
    try {
        // 获取 JWT Token（假设存储在 localStorage 中）
        const token = localStorage.getItem('JWToken');
        if (!token) {
            alert('未找到登录信息，请重新登录！');
            return;
        }

        // 获取表单中的用户输入数据
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !password) {
            alert('用户名和密码不能为空！');
            return;
        }

        // 构造请求参数
        const formData = new URLSearchParams();
        formData.append('user_name', username);
        formData.append('password', password);

        // 调用后端接口
        const response = await fetch('http://api.demo.joking7.com:8081/user/update/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'JWToken': token,
            },
            body: formData,
        });

        // 解析响应数据
        const result = await response.json();
        if (result.code === 200) {
            alert('用户信息更新成功！');
        } else {
            alert(`更新失败: ${result.msg}`);
        }
    } catch (error) {
        console.error('Error updating user profile:', error);
        alert('更新用户信息时发生错误，请稍后再试。');
    }
}

// 页面加载后获取用户信息
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.endsWith("manage.html")) {
        fetchUserProfile();
        // 为按钮绑定点击事件
        document.getElementById('update-user').addEventListener('click', (event) => {
            event.preventDefault(); // 防止表单默认提交行为
            updateUserProfile();
        });


    }
});

