// util, srcとかのモジュールに分ける方法を調べる
//let,var, constの使い分けがうまくできていない

class PSMAnalyzer {
    constructor(csv_array) {
        this.csv_array = csv_array;
    }

    /* util : psm analysis */

    analyze(analysis_unit) {
        let psm_array = [];
        for (let property_index = 1; property_index < this.csv_array[0].length; property_index++) {
            let property_array = this.eachPropertyAnalyze(property_index, analysis_unit);
            psm_array.push(property_array);
        }
        return psm_array;
    }

    eachPropertyAnalyze(property_index, analysis_unit) {
        let each_property_array = [];
        for (let i = 1; i < this.csv_array.length; i++) {
            each_property_array.push(Number(this.csv_array[i][property_index]));
        }

        each_property_array.sort((a,b)=> {
            return a > b ? 1: -1;
        });

        let is_high = (property_index === 1 || property_index === 3);
        let count_array = this.countHelper(each_property_array, is_high, analysis_unit);
        return count_array;
    }

    countHelper(array, is_high, unit) {
        let count_array = [];
        let threshold = unit;
        let array_index = 0;

        //昇順にソートしたことでこのように処理できる
        while (array_index < array.length) {
            if ((is_high && array[array_index] > threshold) || (!is_high && array[array_index] > threshold)) {
            count_array.push(is_high ? array_index : array.length - array_index);
            threshold += unit;
            } else {
            array_index++;
            }
        }
    
        count_array.push(is_high ? 36 : 0);
        return count_array;
    }

    /* utils : calculate four psm point */

    searchFourPoint(array_ascend, array_descend, unit) {
        let index = 0;

        while (array_ascend[index] <= array_descend[index]) {
            index++;
        }

        let four_point_array = [
            [unit * index, array_ascend[index - 1]],
            [unit * (index + 1), array_ascend[index]],
            [unit * index, array_descend[index - 1]],
            [unit * (index + 1), array_descend[index]]
        ];

        return four_point_array;
    }

    calCrossPoint(point1, point2, point3, point4) {
        let cross_point = [];
        // point : [x, y]
    
        var x = (point3[1]-point1[1])*(point1[0]-point2[0])*(point3[0]-point4[0])+ 
                point1[0]*(point1[1]-point2[1])*(point3[0]-point4[0]) - 
                point3[0]*(point3[1]-point4[1])*(point1[0]-point2[0]);

        x = x/((point1[1]-point2[1])*(point3[0]-point4[0]) - (point1[0]-point2[0])*(point3[1]-point4[1]));

        let y = x*(point1[1]-point2[1])/(point1[0]-point2[0]) + point1[1] - point1[0]*(point1[1]-point2[1])/(point1[0]-point2[0]);

        cross_point.push(x);
        cross_point.push(y);
        return cross_point;
    }

    calFourPSMPoint(psm_analized_data, unit) {
        let surround_point_pme = this.searchFourPoint(psm_analized_data[2], psm_analized_data[1], unit);
        let pme = this.calCrossPoint(surround_point_pme[0], surround_point_pme[1], surround_point_pme[2], surround_point_pme[3]);
    
        let surround_point_opp = this.searchFourPoint(psm_analized_data[2], psm_analized_data[3], unit);
        let opp = this.calCrossPoint(surround_point_opp[0], surround_point_opp[1], surround_point_opp[2], surround_point_opp[3]);
    
        let surround_point_idp = this.searchFourPoint(psm_analized_data[0], psm_analized_data[1], unit);
        let idp = this.calCrossPoint(surround_point_idp[0], surround_point_idp[1], surround_point_idp[2], surround_point_idp[3]);
    
        let surround_point_pmc = this.searchFourPoint(psm_analized_data[0], psm_analized_data[3], unit);
        let pmc = this.calCrossPoint(surround_point_pmc[0], surround_point_pmc[1], surround_point_pmc[2], surround_point_pmc[3]);
    
        return [pme, opp, idp, pmc];
    }
}

function startPsm() {

    console.log("-----------start analysis------------");

    //111~123 : csvデータを読み込み
    let csvRequest = new XMLHttpRequest();
    csvRequest.open("GET", "PSMrawdata.csv", false);
    try {
        csvRequest.send(null);
    } catch (err) {
        console.log(err);
    }

    let csv_response_text = csvRequest.responseText;
    let csv_array = csv_response_text.split(/\r\n|\n/)
        .filter(line => line.split(",").length > 1)
        .map(line => line.split(","));

    let unit_element = document.getElementById("unit");
    let error_msg = document.getElementById("unit_error");
    error_msg.innerHTMLx = "";

    let analysis_unit = Number(unit_element.value);

    try{
        if(isNaN(analysis_unit)){
            let error_msg = document.getElementById("unit_error");
            error_msg.innerHTML = "analysis_unitには正の整数を入れてください";
            throw new TypeError("unitには整数を入れてください");
        }
        if(analysis_unit<=0 || analysis_unit>250){
            let error_msg = document.getElementById("unit_error");
            error_msg.innerHTML = "analysis_unitには0より大きく250より小さい整数を入れてください";
            throw new RangeError("unitには 0<unit<250の整数を入れてください");
        }
    }catch(err){
        console.error(err)
    }
    

    let analyzer = new PSMAnalyzer(csv_array);
    let psm_analized_data = analyzer.analyze(analysis_unit);
    let psm_four_point = analyzer.calFourPSMPoint(psm_analized_data, analysis_unit);

    let pme_msg = document.getElementById("pme");
    let opp_msg = document.getElementById("opp");
    let idp_msg = document.getElementById("idp");
    let pmc_msg = document.getElementById("pmc");

    pme_msg.innerHTML = "最高価格 : " + Math.round(psm_four_point[0][0]) + "円";
    opp_msg.innerHTML = "理想価格 : " + Math.round(psm_four_point[1][0]) + "円";
    idp_msg.innerHTML = "妥協価格 : " + Math.round(psm_four_point[2][0]) + "円";
    pmc_msg.innerHTML = "最低品質保証価格 : " + Math.round(psm_four_point[3][0]) + "円";

    
    console.log(analysis_unit + "円単位で計算")
    console.log("\n")
    console.log("最高価格 : " + psm_four_point[0][0]);
    console.log("理想価格 : " + psm_four_point[1][0]);
    console.log("妥協価格 : " + psm_four_point[2][0]);
    console.log("最低品質保証価格 : " + psm_four_point[3][0]);
    console.log("------------end analysis-------------");
}

function main() {
    const checkButton = document.getElementById("checkButton");
    checkButton.addEventListener('click', startPsm);
}

main();



/*
参考資料

csvファイル読み込み :
https://kasumiblog.org/javascript-csv-array/#:~:text=%E3%81%BE%E3%81%9A%E6%9C%80%E5%88%9D%E3%81%ABnew%E3%82%92,%E3%81%AE%E8%AA%AD%E3%81%BF%E8%BE%BC%E3%81%BF%E3%81%8C%E5%AE%8C%E4%BA%86%E3%81%A7%E3%81%99%E3%80%82

開発環境構築 : 
https://zenn.dev/sdkfz181tiger/articles/e95252e9e98615

配列ソート : 
https://codelikes.com/javascript-sort/

html側からjsの変数(unit)に入力 : 
https://www.javadrive.jp/javascript/form/index1.html

jsでのclass : 
https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Classes
*/
