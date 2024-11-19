// Import our custom CSS
import '../scss/styles.scss';
import 'bootstrap';
import Highcharts from 'highcharts';
require('highcharts/modules/variwide')(Highcharts)
require('highcharts/modules/wordcloud')(Highcharts)
require('highcharts/modules/sankey')(Highcharts)
require('highcharts/modules/organization')(Highcharts)
require('highcharts/modules/exporting')(Highcharts)
import { Popover } from 'bootstrap';
import "flatpickr/dist/flatpickr.min.css";
// 引入 flatpickr 的 JS
import flatpickr from "flatpickr";
import Dropzone from "dropzone";
import "dropzone/dist/dropzone.css";
import tooltip from "bootstrap/js/src/tooltip";  // 引入样式文件



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

try {
  if (window.location.pathname.endsWith("dataAnalysis.html")) {
    // 调用图表初始化函数
    initProgress();
    initScore24Chart();
    initAllScore();
    initWordCloud();
    initAwardLine();
  }
} catch (error) {
  console.error(error);
}

window.onload = function(){
  try{
    if (window.location.pathname.endsWith("user.html")) {
      initTimeCountChart();
      activateProgress();
      fetchTrainDate();
    }
  }catch(error){
    console.log(error);
  }
}

//特殊日期————学习记录
async function fetchTrainDate() {
  try {
    const result = await requestWithToken('http://api.demo.joking7.com:8081/history/list/month', {
      method: 'GET',
    });

    if (result.code === 200 && Array.isArray(result.data)) {
      const historyData = result.data;
      const specialDates = []; // 用于存储特殊日期和提示信息

      // 遍历历史记录列表，将每个日期及模式转换为特殊日期格式
      historyData.forEach((item) => {
        const date = new Date(item.time).getDate(); // 获取当天的“日”
        let tooltip = "";

        // 根据 mode 设置提示信息
        if (item.mode === 1) {
          tooltip = "学习单韵母发音";
        } else if (item.mode === 2) {
          tooltip = "学习全韵母发音";
        } else if (item.mode === 3) {
          tooltip = "学习文字发音";
        }

        // 将特殊日期添加到 specialDates 数组
        specialDates.push({ date, tooltip });
      });

      // 获取所有日历中的日期单元格
      const cells = document.querySelectorAll(".calendar tbody td");

      // 遍历单元格并检查是否是特殊日期
      cells.forEach(cell => {
        // 清除旧的特殊日期样式和提示
        cell.classList.remove("special-date");
        cell.removeAttribute("data-tooltip");

        const cellDateText = cell.textContent.trim();
        const cellDate = !isNaN(cellDateText) ? parseFloat(cellDateText) : null;

        if (cellDate) {
          const special = specialDates.find(d => d.date === cellDate);

          if (special) {
            // 添加样式和提示信息
            cell.classList.add("special-date");
            cell.setAttribute("data-tooltip", special.tooltip);
          }
        }
      });

      console.log('日历渲染完成: 特殊日期已更新');
    } else {
      console.error('Unexpected data structure:', result.data);
      alert('渲染当月日期失败: 数据格式错误');
    }
  } catch (error) {
    console.error('渲染当月日期出现错误:', error);
  }
}

//从后端获取数据来更新进度条
async function activateProgress() {
  try {
    const result = await requestWithToken('http://api.demo.joking7.com:8081/plan/user/list', {
      method: 'GET',
    });

    if (result.code === 200) {
      const planData = result.data; // 获取用户学习计划列表
      console.log(planData);
      planData.forEach((plan) => {
        const planBegin = new Date(plan.plan_begin);
        const planEnd = new Date(plan.plan_end);

        // 计算总天数和进度
        const totalDays = Math.round((planEnd - planBegin) / (1000 * 60 * 60 * 24)); // 计算天数
        const progress = ((plan.working_days / totalDays) * 100).toFixed(2); // 计算进度，保留两位小数
        console.log(progress)
        // 更新 progress 元素的 value
        const progressElement = document.getElementById(`mode-${plan.mode}-progress`);
        const progressText = document.getElementById(`mode-${plan.mode}-progress-text`);
        if (progressElement) {
          progressElement.value = progress; // 修改 value 值
          progressText.setAttribute("data-value", progress); // 修改 data-value 属性
        }
      });

      console.log('计划进度更新完成');
    } else {
      alert('获取用户学习计划失败: ' + result.msg);
    }
  } catch (error) {
    console.error('获取用户学习计划出错:', error);
  }
}

// 用户总学习时长统计图表初始化函数
// 统计 一个月内训练模式为 1、2、3 的数量，并生成 Highcharts 图表
async function initTimeCountChart() {
    try {
      const result = await requestWithToken('http://api.demo.joking7.com:8081/history/list/month', {
        method: 'GET',
      });

      if (result.code === 200) {
        const historyData = result.data;

        // 初始化计数器
        const modeCounts = { mode1: 0, mode2: 0, mode3: 0 };

        // 遍历历史记录列表，统计每种 mode 的数量
        historyData.forEach((item) => {
          if (item.mode === 1) {
            modeCounts.mode1 += 1;
          } else if (item.mode === 2) {
            modeCounts.mode2 += 1;
          } else if (item.mode === 3) {
            modeCounts.mode3 += 1;
          }
        });

        Highcharts.setOptions({
          colors: Highcharts.map(Highcharts.getOptions().colors, function (color) {
            return {
              radialGradient: {
                cx: 0.5,
                cy: 0.3,
                r: 0.7
              },
              stops: [
                [0, color],
                [1, Highcharts.color(color).brighten(-0.3).get('rgb')] // darken
              ]
            };
          })
        });
// Build the chart
        Highcharts.chart('timeCount', {
          chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
          },
          title: {
            text: '用户训练时时间分布',
            align: 'left'
          },
          tooltip: {
            pointFormat: '{series.name}: <b>{point.y:.1f}次</b>'
          },
          accessibility: {
            point: {
              valueSuffix: '%'
            }
          },
          plotOptions: {
            pie: {
              allowPointSelect: true,
              cursor: 'pointer',
              size: '100%',
              innerSize: '30%',
              dataLabels: {
                enabled: true,
                format: '<span style="font-size: 1.2em"><b>{point.name}</b>' +
                    '</span><br>' +
                    '<span style="opacity: 0.6">{point.percentage:.1f} ' +
                    '%</span>',
                connectorColor: 'rgba(128,128,128,0.5)'
              }
            }
          },
          series: [{
            name: '学习次数',
            data: [
              { name: '单韵母', y: modeCounts.mode1 },
              { name: '全韵母', y: modeCounts.mode2 },
              { name: '文字', y: modeCounts.mode3 }
            ]
          }]
        });

      } else {
        alert('获取当月历史记录失败: ' + result.msg);
      }
    } catch (error) {
      console.error('获取当月历史记录出错:', error);
    }
}

// 用户韵母得分情况图表初始化函数
function initScore24Chart() {
  Highcharts.chart('score24', {
    chart: {
      type: 'column'
    },
    title: {
      text: '全韵母得分情况汇总'
    },
    subtitle: {
      text: '<p>韵母的小分情况如下</p>'
    },
    xAxis: {
      type: 'category',
      labels: {
        autoRotation: [-45, -90],
        style: {
          fontSize: '13px',
          fontFamily: 'Verdana, sans-serif'
        }
      }
    },
    yAxis: {
      min: 0,
      title: {
        text: '分数'
      }
    },
    legend: {
      enabled: false
    },
    tooltip: {
      pointFormat: '小题得分情况: <b>{point.y:.1f}</b>'
    },
    series: [{
      name: '分数',
      colors: [
        '#9b20d9', '#9215ac', '#861ec9', '#7a17e6', '#7010f9', '#691af3',
        '#6225ed', '#5b30e7', '#533be1', '#4c46db', '#4551d5', '#3e5ccf',
        '#3667c9', '#2f72c3', '#277dbd', '#1f88b7', '#1693b1', '#0a9eaa',
        '#03c69b', '#00f194', '#00e38b', '#00d67f', '#00c772', '#00b965'
      ],
      colorByPoint: true,
      groupPadding: 0,
      data: [
        ['a', 37.33],
        ['o', 31.18],
        ['e', 27.79],
        ['i', 22.23],
        ['u', 21.91],
        ['ü', 21.74],
        ['ai', 21.32],
        ['ei', 20.89],
        ['ui', 20.67],
        ['ao', 19.11],
        ['ou', 16.45],
        ['iu', 16.38],
        ['ie', 15.41],
        ['üe', 15.25],
        ['er', 14.974],
        ['an', 14.970],
        ['en', 14.86],
        ['in', 14.16],
        ['un', 13.79],
        ['ün', 13.64],
        ['ang', 13.64],
        ['eng', 13.64],
        ['ing', 13.64],
        ['ong', 13.64]
      ],
      dataLabels: {
        enabled: true,
        rotation: -90,
        color: '#FFFFFF',
        inside: true,
        verticalAlign: 'top',
        format: '{point.y:.1f}',
        y: 10,
        style: {
          fontSize: '8px',
          fontFamily: 'Verdana, sans-serif'
        }
      }
    }]
  });
}
async function initProgress(){
  try {
    const result = await requestWithToken('http://api.demo.joking7.com:8081/history/list/month', {
      method: 'GET',
    });

    if (result.code === 200) {
      console.log('当月训练分数记录:', result.data); // 输出当月分数
      const historyData = result.data;

      const scoresByDate = {};
      let cumulativeScore = 0; // 累加分数初始化

// 按时间先后排序 historyData
      const sortedHistoryData = historyData.sort((a, b) => {
        const dateA = new Date(a.time);
        const dateB = new Date(b.time);
        return dateA - dateB; // 升序排列
      });

// 计算分数并累加
      sortedHistoryData.forEach((item) => {
        const date = new Date(item.time);
        const monthDay = `${date.getMonth() + 1}-${date.getDate()}`;

        // 解析 answers 并计算得分
        const answers = item.answers || ''; // 防止 answers 为空
        const score = answers.split('').reduce((sum, answer) => sum + (answer === '1' ? 1 : 0), 0);

        // 累加分数
        cumulativeScore += score;

        // 记录累积分数到当前日期
        scoresByDate[monthDay] = cumulativeScore;
      });

// 转换为列表格式供后续绘图使用
      const scoresList = Object.entries(scoresByDate)
          .map(([date, score]) => ({ date, score }));

// 提取绘图所需数据
      const categories = scoresList.map(item => item.date); // 提取日期
      const data = scoresList.map(item => item.score); // 提取累积分数



      Highcharts.chart('progress', {

        title: {
          text: '个人积分',
          align: 'left'
        },

        subtitle: {
          text: '今天你进步了吗?',
          align: 'left'
        },

        yAxis: {
          title: {
            text: '得分情况'
          }
        },

        xAxis: {
          title: {
            text: '日期'
          },
          categories: categories, // 使用从scoreList提取的日期
          accessibility: {
            rangeDescription: '近几天得分情况'
          }
        },

        legend: {
          layout: 'vertical',
          align: 'right',
          verticalAlign: 'middle'
        },

        plotOptions: {
          series: {
            label: {
              connectorAllowed: false
            },
          }
        },

        series: [{
          name: '分数',
          data: data // 使用从scoreList提取的分数
        }],

        responsive: {
          rules: [{
            condition: {
              maxWidth: 500
            },
            chartOptions: {
              legend: {
                layout: 'horizontal',
                align: 'center',
                verticalAlign: 'bottom'
              }
            }
          }]
        }
      });

      return scoresList; // 返回结果供后续处理
    } else {
      alert('获取当月训练分数失败: ' + result.msg);
    }
  } catch (error) {
    console.error('获取当月训练分数出错:', error);
  }


}

async function initAllScore() {
  try {
    const result = await requestWithToken('http://api.demo.joking7.com:8081/history/list/id', {
      method: 'GET',
    });

    if (result.code === 200) {
      const historyData = result.data || [];

      // 初始化统计对象
      const modeScores = {
        1: { totalScore: 0, count: 0 },
        2: { totalScore: 0, count: 0 },
        3: { totalScore: 0, count: 0 },
      };
      const modeCounts = { mode1: 0, mode2: 0, mode3: 0 };

      // 遍历数据，统计得分和次数
      historyData.forEach((item) => {
        const answers = item.answers || '';
        const mode = item.mode;

        // 计算当前记录的得分
        const score = answers.split('').reduce((sum, answer) => sum + (answer === '1' ? 1 : 0), 0);

        // 累加统计
        if (modeScores[mode]) {
          modeScores[mode].totalScore += score;
          modeScores[mode].count += 1;
        }
        // 统计训练次数
        if (mode === 1) modeCounts.mode1 += 1;
        if (mode === 2) modeCounts.mode2 += 1;
        if (mode === 3) modeCounts.mode3 += 1;
      });

      // 计算每个 mode 的平均得分
      const modeAverages = Object.entries(modeScores).map(([mode, { totalScore, count }]) => ({
        mode: parseInt(mode),
        averageScore: count > 0 ? (totalScore / count).toFixed(2) : 0,
      }));

      // 渲染 Highcharts
      Highcharts.chart('allScore', {
        chart: {
          type: 'variwide',
        },
        title: {
          text: '各模式平均得分及训练次数',
        },
        subtitle: {
          text: '<p>三种模式得分及练习次数</p>',
        },
        xAxis: {
          type: 'category',
        },
        caption: {
          text: '宽度与训练次数成正比',
        },
        legend: {
          enabled: false,
        },
        plotOptions: {
          variwide: {
            dataLabels: {
              enabled: true,
              format: '{point.y:.0f}',
            },
          },
        },
        series: [
          {
            name: 'Labor Costs',
            data: [
              ['单韵母', modeCounts.mode1, parseFloat(modeAverages[0].averageScore)],
              ['全韵母', modeCounts.mode2, parseFloat(modeAverages[1].averageScore)],
              ['文字', modeCounts.mode3, parseFloat(modeAverages[2].averageScore)],
            ],
            tooltip: {
              pointFormat: '平均得分: <b>{point.z}</b><br>' + '训练次数: <b>{point.y} 次</b><br>',
            },
            colorByPoint: true,
          },
        ],
      });
    } else {
      alert('获取用户历史记录失败: ' + result.msg);
    }
  } catch (error) {
    console.error('获取用户历史记录出错:', error);
  }
}


function initWordCloud(){
  // 手动设置每个字的错误次数（权重）
  const weights = {
    '包': 5,    // 错误次数 5
    '草': 3,    // 错误次数 3
    '飞': 8,    // 错误次数 8
    '歌': 2,    // 错误次数 2
    '烤': 6,    // 错误次数 6
    '帽': 7,    // 错误次数 7
    '泡': 4,    // 错误次数 4
    '西': 9,    // 错误次数 9
    '珠': 1,    // 错误次数 1
    '字': 10    // 错误次数 10
  };

// 将权重转换为 Highcharts 所需的数据格式
  const data = Object.keys(weights).map(word => ({
    name: word,
    weight: weights[word]  // 使用错误次数作为权重
  }));

// 使用 Highcharts 绘制词云
  Highcharts.chart('wordCloud', {
    accessibility: {
      screenReaderSection: {
        beforeChartFormat: '<h5>{chartTitle}</h5>' +
            '<div>{chartSubtitle}</div>' +
            '<div>{chartLongdesc}</div>' +
            '<div>{viewTableButton}</div>'
      }
    },
    series: [{
      type: 'wordcloud',
      data,  // 使用上面生成的词云数据
      name: '出错次数'
    }],
    title: {
      text: '错题分析',
      align: 'left'
    },
    subtitle: {
      text: '根据错题次数设置的权重',
      align: 'left'
    },
    tooltip: {
      headerFormat: '<span style="font-size: 16px"><b>{point.key}</b>' +
          '</span><br>' +
          '权重: <b>{point.weight}</b><br>'  // 显示权重
    }
  });

}
function initAwardLine(){
  console.log("aaaa")
  Highcharts.chart('awardLine', {
    chart: {
      height: 300,
      inverted: true
    },

    title: {
      text: '成长路径图',
      style: {
        fontSize: '16px' // 调整标题字体大小
      }
    },
    dataLabels: {
      color: 'white',
      style: {
        fontSize: '14px !important' // 强制设置数据标签的字体大小
      }
    },
    accessibility: {
      point: {
        descriptionFormat: '{add index 1}. {toNode.name}' +
            '{#if (ne toNode.name toNode.id)}, {toNode.id}{/if}, ' +
            'reports to {fromNode.id}'
      }
    },

    series: [{
      type: 'organization',
      name: '成长路径',
      keys: ['from', 'to'],
      data: [
        // 第一路径
        ['新手上路', '通过第一关'],
        ['通过第一关', '通过第二关'],
        ['通过第二关', '通过第三关'],

        // 第二路径
        ['初出茅庐', '小试牛刀'],
        ['小试牛刀', '炉火纯青'],
        ['炉火纯青', '融会贯通']
      ],
      levels: [{
        level: 0,
        color: 'silver',
        dataLabels: {
          color: 'white',
          style: {
            fontSize: '5px' // 调整该层级的文本大小
          }
        },
        height: 15
      }, {
        level: 1,
        color: 'silver',
        dataLabels: {
          color: 'white',
          style: {
            fontSize: '5px' // 调整该层级的文本大小
          }
        },
        height: 15
      }, {
        level: 2,
        color: '#980104',
      }, {
        level: 3,
        color: '#359154',
      }],
      nodes: [{
        id: '新手上路',
        title: '新手',
        name: '新手上路',
        image: './icons/icons8-child-50.png',
        imageWidth: 8,
        imageHeight: 8,
      }, {
        id: '通过第一关',
        title: '初级',
        name: '通过第一关',
        image: './icons/icons8-bronze-medal-64.png',
        imageWidth: 8,
        imageHeight: 8,
      }, {
        id: '通过第二关',
        title: '中级',
        name: '通过第二关',
        image: './icons/icons8-silver-medal-64.png',
        imageWidth: 8,
        imageHeight: 8,
      }, {
        id: '通过第三关',
        title: '高级',
        name: '通过第三关',
        image: './icons/icons8-gold-medal-64.png',
        imageWidth: 8,
        imageHeight: 8,
      }, {
        id: '初出茅庐',
        title: '初级',
        name: '初出茅庐',
        image: './icons/icons8-child-50-happy.png',
        imageWidth: 8,
        imageHeight: 8,
      }, {
        id: '小试牛刀',
        title: '中级',
        name: '小试牛刀',
        image: './icons/icons8-award-64.png',
        imageWidth: 8,
        imageHeight: 8,

      }, {
        id: '炉火纯青',
        title: '高级',
        name: '炉火纯青',
        image: './icons/icons8-award-2-64.png',
        imageWidth: 8,
        imageHeight: 8,
      }, {
        id: '融会贯通',
        title: '专家',
        name: '融会贯通',
        image: './icons/icons8-award-3-64.png',
        imageWidth: 8,
        imageHeight: 8,
      }],
      colorByPoint: false,
      color: '#007ad0',
      dataLabels: {
        color: 'white',
        style: {
          fontSize: '14px' // 设置 dataLabel 字体大小
        }
      },
      borderColor: 'white',
      nodeWidth: 'auto'
    }],
    tooltip: {
      outside: true,
      style: {
        fontSize: '8px' // 调整 tooltip 中的字体大小
      }
    },
    exporting: {
      allowHTML: true,
      sourceWidth: 800,
      sourceHeight: 600
    }
  });
}


// train 页面做题功能begin
// 1.页面切换三种选项卡




// 选择 taskMode 容器下的所有 nav-link 元素
let currentTab = "单韵母";  // 默认选中第一个选项卡
let questionInCategory = 1; // 全韵母和单韵母的计数器
let questionInText = 0;      // 文字题的计数器
let allAnswerResult = ""; // 统计所有题目的答案
try{
  document.addEventListener("DOMContentLoaded", function () {

    if (window.location.pathname.endsWith("train.html")) {
      // 页面加载时初始化，加载第一道题目
      loadFirstQuestion();
      // 切换选项卡时更新 currentTab 并加载第一道题目
      const tabs = document.querySelectorAll('.taskMode .nav-link');
      tabs.forEach(tab => {
        tab.addEventListener('click', function () {
          const tabText = this.innerText;
          currentTab = tabText;

          // 切换模式时重置相应的题目计数器
          if (currentTab === "全韵母") {
            questionInCategory = 1;
            currentCategory = categories[0].name;
          } else if (currentTab === "文字") {
            questionInText = 0;
          }else if (currentTab === "单韵母") {
            questionInCategory = 1;
          }

          // 切换选项卡时加载第一道题目
          loadFirstQuestion();
        });
      });
    }
  });
}catch (error)
{
  console.log(error)
}



// 2.设置加载第一道题目的函数
// 定义待上传的题目的图片路径所需要的参数
const categories = [
  { name: '单韵母', count: 6 },
  { name: '复韵母', count: 15 },
  { name: '前鼻韵母', count: 20 },
  { name: '后鼻韵母', count: 24 }
];
let currentCategory = categories[0].name;  // 初始分类


// 在加载第一幅图片时就为下一题按钮绑定上next-question按钮
function loadFirstQuestion() {
  let questionImage;
  if (currentTab === "全韵母") {
    questionImage = getQuestionImage(currentCategory, questionInCategory);
  } else if (currentTab === "文字") {
    questionImage = getQuestionImage("文字", questionInText);
  }else if (currentTab === "单韵母") {
    questionImage = getQuestionImage("单韵母", questionInCategory);
  }
  document.getElementById('question-image').src = questionImage;
  document.getElementById('nextQuestion').addEventListener('click', nextQuestion);
}

let textImages = ["包.png", "草.png", "飞.png", "歌.png", "烤.png", "帽.png", "泡.png", "西.png", "珠.png", "字.png"];
let textName = ["包", "草", "飞", "歌", "烤", "帽", "泡", "西", "珠", "字"];
// 3.设置寻找题目路径的函数
function getQuestionImage(category, questionNumber) {
  if (currentTab === "全韵母") {
    // 对于全韵母类别，返回特定路径
    return `./images/question/全韵母/${category}/题目_${questionNumber}.png`;
  } else if (currentTab === "文字") {
    // 对于文字类别，直接返回图片列表中的图片
    return `./images/question/文字/${textImages[questionNumber]}`;
  }
   else if(currentTab === "单韵母"){
    return `./images/question/单韵母/题目_${questionNumber}.png`;
  }
}


let historyId;
//6.创建新的学习记录,并将创建按钮与进行学习记录的函数绑定.将上传视频和对音频进行评分的功能进行绑定
document.addEventListener("DOMContentLoaded", function () {
  if (window.location.pathname.endsWith("train.html")) {
    const startStudyButton = document.getElementById("start-study");
    const uploadFileButton = document.getElementById("upload-file");

    if (startStudyButton) {
      startStudyButton.addEventListener("click", function () {
        startStudy();
      });
    }

    if (uploadFileButton) {
      uploadFileButton.addEventListener("click", function () {
        handleFileUpload(historyId);
      });
    }
  }
});

//定义开始进行学习记录的函数

async function startStudy() {
  try {
    let mode;
    if (currentTab === "单韵母") {
      mode = 1;
    } else if (currentTab === "全韵母") {
      mode = 2;
    } else if (currentTab === "文字") {
      mode = 3;
    }

    const params = new URLSearchParams({
      trainer: "测试人待定-预期和用户名一样aa",
      teacher: "测试老师待定-可能会重新设置一个输入栏",
      mode: mode,
    });

    const token = localStorage.getItem("JWToken");
    if (!token) {
      alert("用户未登录，无法创建学习记录！");
      return;
    }

    // 发起请求
    const createResult = await requestWithToken(`http://api.demo.joking7.com:8081/Audio/train/new?${params}`, {
      method: "POST",
    });

    // 根据响应结果处理逻辑
    if (createResult.code === 200) {
      historyId = createResult.data;
      alert("创建学习记录成功！");
    } else {
      alert("创建学习记录失败：" + createResult.msg);
    }
  } catch (error) {
    console.error("创建学习记录失败:", error);
  }
}

// 4.设置函数切换题目至下一题
function nextQuestion() {
  if (currentTab === "全韵母") {
    const categoryIndex = categories.findIndex(cat => cat.name === currentCategory);
    const currentCategoryInfo = categories[categoryIndex];

    if (questionInCategory < currentCategoryInfo.count) {
      questionInCategory++;
    } else if (categoryIndex < categories.length-1) {
      // 切换到下一个分类
      questionInCategory++; // 重置题目编号
      currentCategory = categories[categoryIndex + 1].name;
    } else {
      alert('你已经完成所有题目！');
      questionInCategory = 1; // 完成后重置
      // 完成后结束训练并上传训练数据
      const answersScore = calculateTotalScore(allAnswerResult);
      const answers = allAnswerResult; // 替换为实际的答题结果
      const other = "用户的一些备注"; // 替换为实际的附加信息（可选）

      endTraining(historyId, answers, other, answersScore);
      return;
    }
  } else if (currentTab === "文字") {
    questionInText++;
    if (questionInText >= 10) {
      alert('你已经完成所有题目！');
      questionInText = 0; // 完成后重置

      // 完成后结束训练并上传训练数据

      const answersScore = calculateTotalScore(allAnswerResult);
      const answers = allAnswerResult; // 替换为实际的答题结果
      const other = "用户的一些备注"; // 替换为实际的附加信息（可选）

      endTraining(answers, other, answersScore);
      return;
    }
  }
  else if (currentTab === "单韵母") {
    questionInCategory++;
    if (questionInCategory > 6) {
      alert('你已经完成所有题目！');
      questionInCategory = 1; // 完成后重置


      const answersScore = calculateTotalScore(allAnswerResult);
      const answers = allAnswerResult; // 替换为实际的答题结果
      const other = "用户的一些备注"; // 替换为实际的附加信息（可选）

      endTraining(historyId, answers, other, answersScore);
    }
  }
  let questionImage; // 使用 let 代替 const，因为需要后续赋值

// 更新题目编号及图片路径
  if (currentTab === "单韵母") {
    questionImage = getQuestionImage("单韵母", questionInCategory);
  } else if (currentTab === "全韵母") {
    questionImage = getQuestionImage(currentCategory, questionInCategory);
  } else {
    questionImage = getQuestionImage("文字", questionInText);
  }



  document.getElementById('question-image').src = questionImage;

  // 重置得分显示
  document.getElementById('scoreDisplay').innerText = '未打分';
  document.getElementById('videoUpload').value = ''; // 清空视频上传框
  console.log('Button clicked');
}



// 5.设置上传视频,音频至后端并获取答案的函数
//文字部分的代码

function handleFileUpload(historyId) {
  // 获取按钮元素并绑定点击事件
  const uploadButton = document.getElementById("upload-file");

  uploadButton.addEventListener("click", function () {
    const audioInput = document.getElementById("audioInput");
    const audioFile = audioInput.files[0];
    let questionName;

    // 根据 currentTab 的值和题目编号确定题目名称
    if (currentTab === "单韵母" || currentTab === "全韵母") {
      questionName = questionInCategory;
    } else if (currentTab === "文字") {
      questionName = textName[questionInText];
      console.log(questionName);
    }

    // 检查必要条件
    if (!audioFile) {
      alert("请上传一个音频文件！");
      return;
    }

    if (!questionName) {
      alert("题目名称未知！");
      return;
    }

    // 调用上传函数
    uploadAudio(historyId, audioFile, questionName);

    // 清空前端已上传的 audioFile 值
    audioInput.value = "";
    alert("音频文件已上传并清空！");
  });
}






async function uploadAudio(historyId, audioFile, questionName) {
  const token = localStorage.getItem("JWToken"); // 从本地存储获取 JWT Token
  if (!token) {
    alert("用户未登录，请先登录！");
    return;
  }

  // 初始化 FormData
  const formData = new FormData();
  formData.append("audio", audioFile); // 添加音频文件
  formData.append("answer", questionName); // 添加训练题目名称

  try {
    // 使用 fetch 发送 POST 请求
    const response = await fetch(`http://api.demo.joking7.com:8081/test/predict/upload/1?answer=飞`, {
      method: "POST",
      headers: {
        JWToken: token, // 添加 Token 到请求头
      },
      body: formData, // 将表单数据作为请求体
    });

    // 解析返回的 JSON 数据
    const result = await response.json();

    // 根据返回状态处理逻辑
    if (result.code === 200) {
      const { ans, judgement } = result.data;

      // 更新答案统计
      allAnswerResult += judgement === "对" ? "1" : "0";

      // 显示预测结果
      alert(`预测结果：${ans}，判断：${judgement}`);
      const scoreDisplay = document.getElementById("scoreDisplay");
      if (scoreDisplay) {
        scoreDisplay.innerText = `${judgement}`;
      }

      console.log("当前所有题目结果:", allAnswerResult);
    } else {
      alert(`上传失败：${result.msg}`);
    }
  } catch (error) {
    console.error("上传音频时发生错误:", error);
    alert("上传失败，请稍后重试！");
  }
}
function calculateTotalScore(allAnswerResult) {
  let totalScore = 0;

  // 遍历 allAnswerResult 字符串
  for (const char of allAnswerResult) {
    if (char === '1') {
      totalScore += 1; // 每个 '1' 表示答对一道题，得 1 分
    }
  }

  return totalScore;
}






//7.在最后的练习中结束学习记录，并更新一些完成训练后才能有的参数
// 定义结束训练的函数

async function endTraining(historyId, answers, other, answersScore) {
  try {
    // 从本地存储获取 Token
    const token = localStorage.getItem("JWToken");

    // 构造请求 URL 和请求体
    const url = `http://api.demo.joking7.com:8081/Audio/train/end/${historyId}`;
    const formData = new URLSearchParams();
    formData.append("history_id", historyId); // 用户答题结果，如 "10101"
    formData.append("answers", answers); // 用户答题结果，如 "10101"
    formData.append("other", other || ""); // 其他附加信息，默认为空字符串
    formData.append("answers_score", answersScore); // 答案得分，如 "85"

    // 发起 POST 请求
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded", // 表单格式
        JWToken: token, // 附加 Token
      },
      body: formData.toString(),
    });

    // 处理响应
    const result = await response.json();
    if (response.ok && result.code === 200) {
      alert("训练记录已成功结束！");
      console.log("服务器返回的响应：", result);
    } else {
      console.error("服务器返回错误：", result);
      alert(`提交失败: ${result.msg}`);
    }
  } catch (error) {
    console.error(error);
  }
}






// train 页面做题功能end

//学习计划页面 start
//  train 创建学习计划卡片
try{
  if (window.location.pathname.endsWith("train.html")) {
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
      } else if (typeName === "文字") {
        targetTab = document.getElementById("tab-3");
      }

// 将新卡片插入到目标区域
      targetTab.appendChild(newCard);

    });

    document.addEventListener('DOMContentLoaded', () => {
      flatpickr('.flatpickr', {
        dateFormat: "Y-m-d"  // 设定日期格式
      });
    });
  }
}catch(error)
{
  console.log(error)
}


// 2.上传学习计划背景图
try{
  Dropzone.autoDiscover = false;
  let myDropzone;  // 将 myDropzone 作为全局变量
  document.addEventListener("DOMContentLoaded", function() {
    if (window.location.pathname.endsWith("train.html")) {
      // 确保 Dropzone 没有重复初始化
      if (!Dropzone.instances.length) {
        // 初始化 Dropzone 实例
        myDropzone = new Dropzone(".dropzone", {
          url: "/upload",  // 上传路径
          maxFiles: 1,     // 限制上传文件数为 1
          autoProcessQueue: false,  // 禁用自动上传
          init: function() {
            // 监听文件添加事件
            this.on("addedfile", function(file) {
              // 生成预览图片的 URL
              const imageURL = URL.createObjectURL(file);
              // 存储背景图片的 URL
              document.getElementById("backgroundImagePreview").value = imageURL;
            });
          }
        });
      }

      // 监听清除按钮点击事件
      document.getElementById("clearBackgroundImage").addEventListener('click', function() {
        if (myDropzone) {
          // 清除 Dropzone 中的所有文件
          myDropzone.removeAllFiles(true);  // true 参数表示清除文件队列并触发删除事件
          // 清空隐藏字段的值
          document.getElementById("backgroundImagePreview").value = "";  // 清除隐藏字段的值
        }
      });
    }
  });
}catch (error)
{
  console.log(error)
}

//3.创建学习计划至后端
// 调用创建用户学习计划的函数
if (window.location.pathname.endsWith("train.html")) {
  document.addEventListener("DOMContentLoaded", function () {
    addPlan();
  });
}

async function addPlan() {
  try {
    // 从 localStorage 中获取 JWToken
    const token = localStorage.getItem("JWToken");
    if (!token) {
      alert("用户未登录，请先登录！");
      return;
    }

    // 获取 "立即创建" 按钮
    const createButton = document.getElementById("createEventButton");

    // 监听按钮点击事件
    createButton.addEventListener("click", async () => {
      console.log("立即创建按钮被点击！");

      // 获取模态框中的表单
      const form = document.getElementById("plan");

      // 检查表单是否存在
      if (form) {
        // 使用 FormData 获取表单数据
        const formData = new FormData(form);

        // 获取具体的表单字段数据
        const planType = formData.get("planType"); // 训练类型
        const planTitle = formData.get("planTitle"); // 计划标题
        const planDescription = formData.get("planDescription"); // 计划概要
        const startDate = formData.get("startDate"); // 起始日期
        const endDate = formData.get("endDate"); // 终止日期

        // 根据计划类型设置 mode
        let planMode;
        if (planType==="单韵母") {
          planMode = 1;
        } else if (planType ==="全韵母") {
          planMode = 2;
        } else if (planType ==="文字") {
          planMode = 3;
        }
        else {
          alert("学习类型填写错误！");
          return;
        }

        // 数据验证逻辑
        if (!planTitle || !startDate || !endDate) {
          alert("请填写所有必填字段！");
          return;
        }
        // 构造请求体
        const requestBody = {
          plan_id:"",
          user_id: "",
          plan_begin: startDate,
          plan_end: endDate,
          title: planTitle,
          description: planDescription,
          mode: planMode,
          working_days: ""
        };

        console.log("构造的请求体：", requestBody);

        // 发起最终请求
        const createResult = await fetch("http://api.demo.joking7.com:8081/plan/user/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            JWToken: token,
          },
          body: JSON.stringify(requestBody),
        }).then((res) => res.json());

        // 处理创建计划的结果
        if (createResult.code === 200) {
          alert("创建学习计划成功！");
          // 清空表单数据
          document.querySelector("input[placeholder='Event name here']").value = "";
          document.querySelector("input[placeholder='Type name here']").value = "";
          document.querySelector("textarea[placeholder='Ex: topics, schedule, etc.']").value = "";
          document.querySelector("input[placeholder='Select start date']").value = "";
          document.querySelector("input[placeholder='Select end date']").value = "";
        } else {
          alert("创建学习计划失败: " + createResult.msg);
        }
      } else {
        console.error("表单不存在！");
      }
    });
  } catch (error) {
    console.error("创建学习计划出错:", error);
  }
}



// train 事件查看
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.endsWith("train.html")) {
    const scrollButton = document.getElementById('scrollButton');
    const bottomSection = document.getElementById('start-study');

    if (scrollButton && bottomSection) {
      scrollButton.addEventListener('click', function() {
        bottomSection.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }
});


// 光暗调节
const toggleButton = document.getElementById('theme-toggle');
const body = document.body;

// 检查用户首选项并加载模式
const currentTheme = localStorage.getItem('theme') || 'light-mode';
body.classList.add(currentTheme);

toggleButton.addEventListener('click', () => {
  if (body.classList.contains('light-mode')) {
    body.classList.replace('light-mode', 'dark-mode');
    localStorage.setItem('theme', 'dark-mode');
  } else {
    body.classList.replace('dark-mode', 'light-mode');
    localStorage.setItem('theme', 'light-mode');
  }
});





// 验证JWT的函数，用于包裹住其他请求
async function requestWithToken(url, options = {}) {
  const token = localStorage.getItem('JWToken'); // 从 localStorage 获取 Token

  // 添加 Token 到请求头
  options.headers = {
    ...(options.headers || {}),
    'Content-Type': 'application/json',
    'JWToken': token || '', // 如果没有 Token，默认传空字符串
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    // 检查是否需要跳转登录
    if (data.code === -1) {
      alert('Token 已失效，请重新登录!');
      window.location.href = 'http://localhost:8080/login.html'; // 跳转登录页面
    }

    return data; // 返回响应数据
  } catch (error) {
    console.error('请求失败:', error);
    throw error; // 抛出错误以便调用方处理
  }
}




let userName;

// 获取用户名，并在页面加载时调用
async function fetchUserName() {
  try {
    const result = await requestWithToken('http://api.demo.joking7.com:8081/user/profile', {
      method: 'GET',
    });
    const token = localStorage.getItem("JWToken");
    if (result.code === 200) {
      userName = result.data.user_name;
      console.log('获取的用户名:', userName);

      // 检查当前页面路径并更新用户名
      if (window.location.pathname.endsWith("user.html")) {
        const usernameElement2 = document.getElementById("userName2");
        if (usernameElement2) {
          usernameElement2.textContent = userName;
        }
      }

      if (
          window.location.pathname.endsWith("user.html") ||
          window.location.pathname.endsWith("train.html") ||
          window.location.pathname.endsWith("dataAnalysis")
      ) {
        const usernameElement1 = document.getElementById("userName1");
        if (usernameElement1) {
          usernameElement1.textContent = userName;
        }
      }

      return result.data; // 返回数据以便进一步处理
    } else {
      alert('获取用户信息失败: ' + result.msg);
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
}

// 页面加载时调用
document.addEventListener("DOMContentLoaded", fetchUserName);




// 获取用户最近学习的日期并显示在页面
async function fetchUserLastDate() {
  try {
    const result = await requestWithToken('http://api.demo.joking7.com:8081/history/list/month', {
      method: 'GET',
    });

    if (result.code === 200) {
      console.log('当月学习计划:', result.data);

      const trainingData = result.data;

      // 检查是否有数据
      if (!trainingData || trainingData.length === 0) {
        console.log("没有训练数据");
        updateLastTrainingDate("无记录");
        return;
      }

      // 找到最近一次训练日期
      const latestTrainingDate = trainingData
          .map(entry => new Date(entry.time)) // 转换日期字符串为 Date 对象
          .sort((a, b) => b - a)[0]; // 按时间降序排列，取最近的日期

      console.log("最近一次训练日期:", latestTrainingDate);

      // 格式化日期
      const formattedDate = latestTrainingDate.toISOString().split("T")[0].replace(/-/g, ".");
      updateLastTrainingDate(formattedDate);
    } else {
      alert('获取用户最近一次训练日期失败: ' + result.msg);
    }
  } catch (error) {
    console.error('获取用户最近学习日期代码有问题:', error);
  }
}

// 更新页面元素的文字
function updateLastTrainingDate(dateText) {
  const cardFooter = document.querySelector(".card-footer");
  if (cardFooter) {
    cardFooter.textContent = `最近一次训练: ${dateText}`;
  } else {
    console.error("无法找到 .card-footer 元素");
  }
}

// 页面加载后调用
document.addEventListener("DOMContentLoaded", async () => {

  if (window.location.pathname.endsWith("user.html")) {
    await fetchUserLastDate();
  }
});






// 获取当月学习计划
async function fetchUserPlan() {
  try {
    const result = await requestWithToken('http://api.demo.joking7.com:8081/plan/user/list', {
      method: 'GET',
    });

    if (result.code === 200) {
      console.log('当月学习计划:', result.data); // 输出当月历史记录
      return result.data; // 返回数据以便进一步处理
    } else {
      alert('获取用户学习计划失败: ' + result.msg);
    }
  } catch (error) {
    console.error('获取用户学习计划出错:', error);
  }
}

if (window.location.pathname.endsWith("train.html")) {
  document.addEventListener("DOMContentLoaded", async () => { // 将回调函数声明为 async
    try {
      const planData = await fetchUserPlan()
      if (planData) {
        console.log('展示用户学习计划:', planData);
        // 在这里将 monthData 显示到页面上
      }
    } catch (error) {
      console.error('展示用户学习计划时出错:', error);
    }
  });
}










//根据JWT自动解析用户ID并获取当月历史记录
async function fetchHistoryByMonth() {
  try {
    const result = await requestWithToken('http://api.demo.joking7.com:8081/history/list/month', {
      method: 'GET',
    });

    if (result.code === 200) {
      console.log('当月历史记录:', result.data); // 输出当月历史记录
      return result.data; // 返回数据以便进一步处理
    } else {
      alert('获取当月历史记录失败: ' + result.msg);
    }
  } catch (error) {
    console.error('获取当月历史记录出错:', error);
  }
}












//根据JWT自动解析用户ID并获取全部历史记录
async function fetchHistoryByUserId() {
  try {
    const result = await requestWithToken('http://api.demo.joking7.com:8081/history/list/id', {
      method: 'GET',
    });

    if (result.code === 200) {
      console.log('用户所有历史记录:', result.data); // 输出用户所有历史记录
      return result.data; // 返回数据以便进一步处理
    } else {
      alert('获取用户历史记录失败: ' + result.msg);
    }
  } catch (error) {
    console.error('获取用户历史记录出错:', error);
  }
}


if (window.location.pathname.endsWith("user.html")) {
  document.addEventListener("DOMContentLoaded", async () => { // 将回调函数声明为 async
    try {
      const monthData = await fetchHistoryByMonth();
      if (monthData) {
        console.log('展示当月历史记录:', monthData);
        // 在这里将 monthData 显示到页面上
      }

      const allData = await fetchHistoryByUserId();
      if (allData) {
        console.log('展示所有历史记录:', allData);
        // 在这里将 allData 显示到页面上
      }
    } catch (error) {
      console.error('获取历史记录时出错:', error);
    }
  });
}













