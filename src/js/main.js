// Import our custom CSS
import '../scss/styles.scss';
import 'bootstrap';
import Highcharts from 'highcharts';
import { Popover } from 'bootstrap';
import "flatpickr/dist/flatpickr.min.css";
// 引入 flatpickr 的 JS
import flatpickr from "flatpickr";
import Dropzone from "dropzone";
import "dropzone/dist/dropzone.css";  // 引入样式文件


// Create an example popover
document.querySelectorAll('[data-bs-toggle="popover"]')
  .forEach(popover => {
    new Popover(popover);
  });

// Hover effect for images
document.addEventListener('DOMContentLoaded', () => {
  const circles = document.querySelectorAll('.circle');
  let isHovering = false;

  // 当鼠标进入任意一个图片区域时
  circles.forEach(circle => {
    circle.addEventListener('mouseenter', () => {
      isHovering = true;
    });

    circle.addEventListener('mouseleave', () => {
      isHovering = false;
      resetCircles();
    });
  });

  // 鼠标移动时让图片朝着鼠标方向轻微移动
  document.addEventListener('mousemove', (e) => {
    if (isHovering) {
      moveCircles(e.clientX, e.clientY);
    }
  });

  function moveCircles(mouseX, mouseY) {
    circles.forEach(circle => {
      const rect = circle.getBoundingClientRect();
      const offsetX = (mouseX - (rect.left + rect.width / 2)) * 0.08;  // 调整灵敏度
      const offsetY = (mouseY - (rect.top + rect.height / 2)) * 0.08;  // 调整灵敏度

      // 使用translate保持图片的平行运动
      circle.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    });
  }

  function resetCircles() {
    circles.forEach(circle => {
      circle.style.transform = 'translate(0, 0)';
    });
  }
});


try{
  Highcharts.chart('timeCount', {
    chart: {
      type: 'pie',
      plotBackgroundColor:'ghostwhite',
      custom: {},
      events: {
        render() {
          const chart = this,
              series = chart.series[0];
          let customLabel = chart.options.chart.custom.label;

          if (!customLabel) {
            customLabel = chart.options.chart.custom.label =
                chart.renderer.label(
                    'Total<br/>' +
                    '<strong>1 224</strong>' + '<small>min</small>'
                )
                    .css({
                      color: '#000',
                      textAnchor: 'middle'
                    })
                    .add();
          }

          const x = series.center[0] + chart.plotLeft,
              y = series.center[1] + chart.plotTop -
                  (customLabel.attr('height') / 2);

          customLabel.attr({
            x,
            y
          });
          // Set font size based on chart diameter
          customLabel.css({
            fontSize: `${series.center[2] / 12}px`
          });
        }
      }
    },
    accessibility: {
      point: {
        valueSuffix: '%'
      }
    },
    title: {
      text: '用户训练模式时长统计'
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.0f}%</b>'
    },
    legend: {
      enabled: false
    },
    plotOptions: {
      series: {
        allowPointSelect: true,
        cursor: 'pointer',
        borderRadius: 8,
        dataLabels: [{
          enabled: true,
          distance: 20,
          format: '{point.name}'
        }, {
          enabled: true,
          distance: -15,
          format: '{point.percentage:.0f}%',
          style: {
            fontSize: '0.9em'
          }
        }],
        showInLegend: true
      }
    },
    series: [{
      name: '训练时长分布',
      colorByPoint: true,
      innerSize: '75%',
      data: [{
        name: '简单模式',
        y: 36.9
      }, {
        name: '中等模式',
        y: 37.0
      }, {
        name: '困难模式',
        y: 26.4
      }]
    }]
  });
}
catch(error){
  console.log(error)
}



const totalQuestions = 24;  // 题目总数
let currentQuestion = 1;  // 当前题目编号
const categories = [
  { name: '单韵母', count: 6 },
  { name: '复韵母', count: 15 },
  { name: '前鼻韵母', count: 20 },
  { name: '后鼻韵母', count: 24 }
];
let currentCategory = categories[0].name;  // 初始分类
let questionInCategory = 1;  // 当前分类中的题目编号

// 获取题目图片路径
function getQuestionImage(category, questionNumber) {
  console.log('get picture');
  return `./images/question/${category}/题目_${questionNumber}.png`;
}

// 提交答案并得分
function submitAnswer() {
  const videoInput = document.getElementById('videoUpload');
  const scoreDisplay = document.getElementById('scoreDisplay');
  if (!videoInput.files.length) {
    alert('请上传视频作为答案!');
    return;
  }
  const score = Math.floor(Math.random() * 100) + 1;
  if (scoreDisplay) {
    scoreDisplay.innerText = `${score} 分`;
  }
}

// 切换到下一题
function nextQuestion() {
  // 找到当前分类信息
  const categoryIndex = categories.findIndex(cat => cat.name === currentCategory);
  const currentCategoryInfo = categories[categoryIndex];

  // 更新题目编号
  if (questionInCategory < currentCategoryInfo.count) {
    questionInCategory++;
  } else if (categoryIndex < categories.length - 1) {
    // 切换到下一个分类
    questionInCategory++;
    currentCategory = categories[categoryIndex + 1].name;
  } else {
    alert('你已经完成所有题目！');
    return;
  }

  // 更新题目编号及图片路径
  currentQuestion++;
  const questionImage = getQuestionImage(currentCategory, questionInCategory);
  document.getElementById('question-image').src = questionImage;

  // 重置得分显示
  document.getElementById('scoreDisplay').innerText = '未打分';
  document.getElementById('videoUpload').value = '';  // 清空视频上传框
  console.log('Button clicked');
}

// 设置初始题目图片



document.addEventListener("DOMContentLoaded", function () {
  const img=document.getElementById("question-image")
  // 页面加载完毕后立即设置题目图片的 src
  img.src = getQuestionImage(currentCategory, questionInCategory);
  document.getElementById('nextQuestion').addEventListener('click', nextQuestion);
});

Dropzone.autoDiscover = false;
try{
  // 初始化 Dropzone
  document.addEventListener("DOMContentLoaded", function() {
    // 确保 Dropzone 没有重复初始化
    if (!Dropzone.instances.length) {
      const myDropzone = new Dropzone(".dropzone", {
        url: "/upload",  // 上传路径，可以设置为后端的上传地址
        maxFiles: 1,     // 限制只允许上传一张背景图
        autoProcessQueue: false,  // 关闭自动上传
        init: function() {
          this.on("addedfile", function(file) {
            // 预览图片的 URL
            const imageURL = URL.createObjectURL(file);
            // 存储背景图片的 URL
            document.getElementById("backgroundImagePreview").value = imageURL;
          });
        }
      });
    }
  });
}catch (error)
{
  console.log(error)
}

try{
  document.getElementById("createEventButton").addEventListener("click", function () {
    // 获取表单输入的值
    const eventName = document.querySelector("input[placeholder='Event name here']").value;
    const typeName = document.querySelector("input[placeholder='Type name here']").value;
    const eventDescription = document.querySelector("textarea[placeholder='Ex: topics, schedule, etc.']").value;
    const startDate = document.querySelector("input[placeholder='Select start date']").value;
    const endDate = document.querySelector("input[placeholder='Select end date']").value;
    const backgroundImage = document.getElementById("backgroundImagePreview").value; // 获取背景图 URL

    // 获取 card-body 元素
    const cardBody = document.querySelector(".card-body");

    // 创建新的卡片元素
    const newCard = document.createElement("div");
    newCard.classList.add("card", "mb-3", "shadow-sm");
    newCard.style.width = "300px";  // 设置卡片的宽度
    newCard.innerHTML = `
  <div class="card-img-top" style="background-image: url('${backgroundImage}'); background-size: contain; background-position: center; height: 115px; width: 100%; position: relative;">
    <a class="btn btn-xs btn-primary position-absolute" href="event-details.html" style="bottom: -18px; left: 18px;">${typeName}</a>
  </div>
  <div class="card-body position-relative" style="width: 100%; padding: 20px 18px;"> 
    <h6 class="mt-3">
      ${eventName}
    </h6>
    <p class="mb-0 small">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calendar3" viewBox="0 0 16 16">
        <path d="M14 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2M1 3.857C1 3.384 1.448 3 2 3h12c.552 0 1 .384 1 .857v10.286c0 .473-.448.857-1 .857H2c-.552 0-1-.384-1-.857z"/>
        <path d="M6.5 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m-9 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m-9 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
      </svg> 起始日期: ${startDate}
    </p>
    <p class="small">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calendar-check" viewBox="0 0 16 16">
        <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0"/>
        <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
      </svg> 终止日期: ${endDate}
    </p>
    <p class="small">
      ${eventDescription}
    </p>
    <!-- Button -->
    <div class="d-flex mt-3">
      <div class="w-75">
        <input type="checkbox" class="btn-check d-block" id="Interested${Math.random().toString(36).substr(2, 9)}">
        <label class="btn btn-sm btn-outline-success d-block" for="Interested${Math.random().toString(36).substr(2, 9)}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-walking" viewBox="0 0 16 16">
            <path d="M9.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0M6.44 3.752A.75.75 0 0 1 7 3.5h1.445c.742 0 1.32.643 1.243 1.38l-.43 4.083a1.8 1.8 0 0 1-.088.395l-.318.906.213.242a.8.8 0 0 1 .114.175l2 4.25a.75.75 0 1 1-1.357.638l-1.956-4.154-1.68-1.921A.75.75 0 0 1 6 8.96l.138-2.613-.435.489-.464 2.786a.75.75 0 1 1-1.48-.246l.5-3a.75.75 0 0 1 .18-.375l2-2.25Z"/>
            <path d="M6.25 11.745v-1.418l1.204 1.375.261.524a.8.8 0 0 1-.12.231l-2.5 3.25a.75.75 0 1 1-1.19-.914zm4.22-4.215-.494-.494.205-1.843.006-.067 1.124 1.124h1.44a.75.75 0 0 1 0 1.5H11a.75.75 0 0 1-.531-.22Z"/>
          </svg> 已坚持10天
        </label>
      </div>
      <div class="dropdown ms-3">
         <a href="#" class="btn btn-sm btn-primary-soft d-flex align-items-center" data-bs-toggle="dropdown" aria-expanded="false">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-share me-2" viewBox="0 0 16 16">
                <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5m-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"/>
            </svg>
         </a>
         <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="shareDropdown">
            <li><a class="dropdown-item" href="#"><img width="16" height="16" src="https://img.icons8.com/doodle/48/weixing.png" alt="weixing"/>分享至微信</a></li>
            <li><a class="dropdown-item" href="#"><img width="16" height="16" src="https://img.icons8.com/external-tal-revivo-color-tal-revivo/24/external-tencent-qq-an-instant-messaging-software-service-and-web-portal-developed-logo-color-tal-revivo.png" alt="external-tencent-qq-an-instant-messaging-software-service-and-web-portal-developed-logo-color-tal-revivo"/>分享至QQ</a></li>
         </ul>
      </div>
    </div>
  </div>`;

    let targetTab;

// 根据 typeName 决定卡片插入的区域
    if (typeName === "单韵母") {
      targetTab = document.getElementById("tab-1");
    } else if (typeName === "全韵母") {
      targetTab = document.getElementById("tab-2");
    } else if (typeName === "复杂韵母") {
      targetTab = document.getElementById("tab-3");
    }

// 将新卡片插入到目标区域
    targetTab.appendChild(newCard);
    // 关闭模态框
    // const modal = Modal.getInstance(document.getElementById("modalCreateEvents"));
    // modal.hide();
    // 清空表单
    document.querySelector("input[placeholder='Event name here']").value = "";
    document.querySelector("input[placeholder='Type name here']").value = "";
    document.querySelector("textarea[placeholder='Ex: topics, schedule, etc.']").value = "";
    document.querySelector("input[placeholder='Select start date']").value = "";
    document.querySelector("input[placeholder='Select end date']").value = "";
    document.getElementById("backgroundImagePreview").value = "";
  });

  document.addEventListener('DOMContentLoaded', () => {
    flatpickr('.flatpickr', {
      dateFormat: "Y-m-d"  // 设定日期格式
    });
  });
}catch(error)
{
  console.log(error)
}


const scrollButton = document.getElementById('scrollButton');
const bottomSection = document.getElementById('studySection');

// 为按钮绑定点击事件
scrollButton.addEventListener('click', function() {
  // 使用 scrollIntoView() 平滑滚动到指定元素
  bottomSection.scrollIntoView({ behavior: 'smooth' });
});




const passwordInput = document.getElementById('password');
const passwordStrength = document.getElementById('password-strength');

passwordInput.addEventListener('input', function () {
  const value = passwordInput.value;
  let strength = '弱';
  let color = '#ef4444'; // 默认红色

  // 密码强度等级
  if (value.length >= 8) {
    strength = '中';
    color = '#f59e0b'; // 橙色
    if (/[A-Za-z]/.test(value) && /\d/.test(value)) {
      strength = '强';
      color = '#22c55e'; // 绿色
    }
  }

  // 更新密码强度提示
  passwordStrength.textContent = `密码强度: ${strength}`;
  passwordStrength.style.color = color;
});

// 确认密码匹配检查
const passwordConfirmInput = document.getElementById('password-confirm');
const passwordMismatch = document.getElementById('password-mismatch');

passwordConfirmInput.addEventListener('input', function () {
  if (passwordInput.value !== passwordConfirmInput.value) {
    passwordMismatch.style.display = 'block';
  } else {
    passwordMismatch.style.display = 'none';
  }
});

// 表单验证提交
document.querySelector('form').addEventListener('submit', function (event) {
  event.preventDefault(); // 阻止表单提交
  // 确保所有表单元素通过验证
  if (this.checkValidity()) {
    // 这里可以提交表单
    alert('表单验证通过');
  } else {
    this.classList.add('was-validated');
  }
});






