// Import our custom CSS
import '../scss/styles.scss';
import 'bootstrap';
import Highcharts from 'highcharts';

// Import only the Bootstrap components we need
import { Popover } from 'bootstrap';

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



Dropzone.autoDiscover = false;

// 初始化特定的 Dropzone 元素
const Dropzone = new Dropzone('.dropzone', {
  url: './icons', // 替换为实际上传处理的后端 API 地址
  maxFiles: 1, // 设置允许的最大文件数
  maxFilesize: 5, // 文件大小限制（单位：MB）
  acceptedFiles: 'image/*' // 限制为图片文件
});

const totalQuestions = 24;  // 题目总数
let currentQuestion = 1;  // 当前题目编号
const categories = [
  { name: '单韵母', count: 6 },
  { name: '复韵母', count: 9 },
  { name: '前鼻韵母', count: 5 },
  { name: '后鼻韵母', count: 4 }
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
    questionInCategory = 1;
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
console.log('等等')
const img=document.getElementById("question-image")
console.log('大大',img)
document.addEventListener("load", function () {
  // 页面加载完毕后立即设置题目图片的 src
  img.src = getQuestionImage(currentCategory, questionInCategory);
});
window.onload = function () {
  document.getElementById('question-image').src = getQuestionImage(currentCategory, questionInCategory);
}
document.getElementById('nextQuestion').addEventListener('click', nextQuestion);

window.onload = function () { console.log("onload") }


