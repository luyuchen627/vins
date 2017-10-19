$(document).ready(function() {
	var args = parseQueryArgs();
	var openid = args.openid;
	var	uuid = args.uuid;
	var	schoolid = args.schoolid;
	var students = null;
	var examHistory = null;

	var api = {
		//获取报表
		getReport: function(params) {
			var ajaxUrl = pageLoader.url + 'stat.studentreport';
			query("post",ajaxUrl,params.data,params.success,params.fail);
		},
		//获取科目
		getProject: function(params) {
			var ajaxUrl = pageLoader.url + 'system.listclassifies';
			query("post",ajaxUrl,params.data,params.success,params.fail);
		},
	}
	var util = {
		//根据科目id返回科目名称
		getProjectName: function (projectid){
			if(!project || project.length <= 0){
				return "";
			}
			for(var i = 0; i < project.length; i++){
				if(project[i].id == projectid){
					return project[i].name;
				}
			}
			return "";
		},
	}

	api.getReport({
		data:{
			uuid:uuid,
			studentid:args.studentid,
			uploadid:args.uploadid,
			examineid:args.examineid
		},
		success: function(res) {
			$(".studentName").text(res.realname);
			$(".studentClass").text(res.classname);
			$(".studentRank").text(res.class_ranking);
			initDom(res.report);
		}
	})

	function analyzeReport(report) {
		var data = {};//知识点的得分
		var subject = {};//不同类型题的得分
		var knowledges = report.knowledges;
		var majors = report.majors;
		for(var i = 0; i < knowledges.length; i++){
			data[knowledges[i].id] = {
				title: knowledges[i].title,
				errornum: 0,
				totalnum: 0,
				getscore: 0,
				totalscore: 0,
				errorno: [],
			};
		}
		for(var j = 0; j < majors.length; j++){
			var detail = majors[j].detail;
			subject[j] = {
				type:majors[j].type,
				getscore: 0,
				totalscore: 0,
				detail:detail,
			};
			for(var m = 0; m < detail.length; m++){
				var littleSubject = detail[m];
				if(littleSubject.k){
					for(var n = 0; n < littleSubject.k.length; n++){
						var knowledgeid = littleSubject.k[n];
						data[knowledgeid].totalnum ++;
						data[knowledgeid].getscore += littleSubject.s;
						data[knowledgeid].totalscore += littleSubject.st;
						if(littleSubject.s < littleSubject.st){
							data[knowledgeid].errornum ++;
							data[knowledgeid].errorno.push(littleSubject.no);//错误题号
						}
					}
				}

				//不同类型题目的得分情况
				subject[j].getscore += littleSubject.s;
				subject[j].totalscore += littleSubject.st;
			}
		}
		// console.log(data);
		// console.log(subject);
		return {
			data:data,
			subject:subject
		};
	}

	function initDom(report) {
		var reportData = analyzeReport(report);
		var data = reportData.data;
		var subject = reportData.subject;
		var bp = $(".baseInfoPanel");
		var sp_con = $(".sp_con");
		var kp_ul = $(".knowledgePanel").find("ul");
		kp_ul.find(".kp_list").remove();
		bp.find(".examTitle").text(report.title);
		bp.find(".getScore").text(report.get_scores);
		bp.find(".totalScore").text(report.total_scores);
		if(subject){
			for( var item in subject){
				var sp_item = $("<div></div>").addClass("sp_item");
				var sp_sdetail = $("<div></div>").addClass("sp_sdetail");
				var sp_type = $("<div></div>").addClass("sp_type").text(getSubjectName(subject[item].type));
				var p = parseInt(subject[item].getscore / subject[item].totalscore * 100);
				var sp_scoreDetail_inner = $("<div></div>").addClass("sp_scoreDetail_inner").text(subject[item].getscore + "/" + subject[item].totalscore).css("background-size",p+"%");
				var sp_scoreDetail = $("<div></div>").addClass("sp_scoreDetail").append(sp_scoreDetail_inner);
				var sp_showdetail = $("<div>查看详情</div>").addClass("sp_showdetail");
				sp_sdetail.append(sp_type).append(sp_scoreDetail).append(sp_showdetail);
				//小题详情
				var sp_detail = $("<div></div>").addClass("sp_detail");
				if(subject[item].detail){
					var itemDetail = subject[item].detail;
					var labelTitle = createItemDetail();
					sp_detail.append(labelTitle);
					for(var i = 0;i < itemDetail.length; i++){
						var sp_list = createItemDetail(itemDetail[i],data);
						sp_detail.append(sp_list);
					}
				}
				sp_item.append(sp_sdetail).append(sp_detail);
				sp_con.append(sp_item);
			}
		}
		if(data){
			for( var key in data){
				var newkd = $("<li></li>").addClass("kp_list").attr("id",key);
				var kdName = $("<span></span>").addClass("kdName").text(data[key].title);
				var errorNum = $("<span></span>").addClass("errorNum").text(data[key].errornum + "/" + data[key].totalnum);
				var errorNos = $("<span></span>").addClass("errorNos");
				if(data[key].errorno.length > 0){
					errorNos.text(data[key].errorno.join(","));
				}else{
					errorNos.text("--");
				}
				var lost_score = parseInt(data[key].totalscore - data[key].getscore);
				var missScore = $("<span></span>").addClass("missScore").text(lost_score);
				var lost_percent = ((lost_score / parseInt(data[key].totalscore)) * 100) .toFixed(2);
				//var missPercent = $("<span></span>").addClass("missPercent").text(lost_percent + "%");
				newkd.append(kdName).append(errorNum).append(errorNos).append(missScore);
				kp_ul.append(newkd);
			}
		}
	}

	function createItemDetail(obj,k_data){
		//展示小题的得分情况
		var sp_title = $("<div></div>");
		var sp_no = $("<span></span>").addClass("sp_no").text("题号");
		var sp_ts = $("<span></span>").addClass("sp_ts").text("总分");
		var sp_score = $("<span></span>").addClass("sp_score").text("得分");
		var sp_kg = $("<span></span>").addClass("sp_kg").text("知识点");
		if(typeof obj == "object"){
			sp_title.addClass("sp_list");
			var sp_no_text = (typeof obj.no != undefined) ? obj.no : "--";
			sp_no.text(sp_no_text);
			var sp_ts_text = (typeof obj.st != undefined) ? obj.st : "--";
			sp_ts.text(sp_ts_text);
			var sp_score_text = (typeof obj.s != undefined)? obj.s : "--";
			sp_score.text(sp_score_text);
			var sp_kg_text = "";
			if(k_data && obj.k){
				for (var i = 0; i < obj.k.length; i++){
					var k_id = obj.k[i];
					if(k_data[k_id] && k_data[k_id].title){
						sp_kg_text += k_data[k_id].title;
					}
				}
			}else{
				sp_kg_text = "--";
			}
			sp_kg.text(sp_kg_text);
		}else{
			sp_title.addClass("sp_title");
		}
		sp_title.append(sp_no).append(sp_ts).append(sp_score).append(sp_kg);
		return sp_title;
	}

	$(".sp_con").on("click",".sp_sdetail",function(){
		var perentNode = $(this).closest(".sp_item");
		perentNode.find(".sp_detail").stop().slideToggle();
		perentNode.siblings(".sp_item").find(".sp_detail").stop().slideUp();
	});
	$(".knowledgePanel").on("click",".errorNos",function(){
		var This = $(this);
		$.Confirm({
			title: '错误题号',
			content: This.text(),
			showcancel:false,
		});
	})

})