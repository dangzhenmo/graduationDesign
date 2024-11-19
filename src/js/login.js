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
                    alert('JWToken 存储成功:');
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

