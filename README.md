# Battery Management System wechat app

#### 项目介绍
蓝牙数据返回解析格式：

0. 最后更新
1. 控制信息
2. 告警信息
3. 剩余电量Ah
4. 剩余电量
5. 最高温度
6. 各温度值
7. 输出功率
8. 总电压值
9. 总电流值
10. 充电电流
11. 放电电流


#### 使用说明


#### API
1. {{domain}}/appsrv/api/login

管理员身份验证，需传递json

	    { "username":"xxx",
	      "password":"yyy"}
返回：

	    {"code":0,
	     "msg":"Success"
	    }

2. {{domain}}/appsrv/analysis/uploads/JSDZ_001.txt

功能：下载对应的蓝牙log文件

蓝牙模式下，通过管理员登陆，在参数页面回多出两个按钮，一个是编辑参数，一个是记录。

点击记录按钮，小程序会将当前的参数上传到服务器，同时小程序将弹出成功对话框并显示蓝牙编号。

通过浏览器可以进行参数查看。访问地址为：https://hzjsdz.cn/appsrv/analysis/uploads/JSDZ_001.txt 

注意需要修改JSDZ_001为成功对话框中对应的蓝牙编号。

#### 参与贡献

1. Fork 本项目
2. 新建 Feat_xxx 分支
3. 提交代码
4. 新建 Pull Request


#### 其它说明

API已备案域名：www.hzjsdz.cn

1. 使用 Readme\_XXX.md 来支持不同的语言，例如 Readme\_en.md, Readme\_zh.md
2. 码云官方博客 [blog.gitee.com](https://blog.gitee.com)
3. 你可以 [https://gitee.com/explore](https://gitee.com/explore) 这个地址来了解码云上的优秀开源项目
4. [GVP](https://gitee.com/gvp) 全称是码云最有价值开源项目，是码云综合评定出的优秀开源项目
5. 码云官方提供的使用手册 [http://git.mydoc.io/](http://git.mydoc.io/)
6. 码云封面人物是一档用来展示码云会员风采的栏目 [https://gitee.com/gitee-stars/](https://gitee.com/gitee-stars/)