// classでまとめた方がいい気がする
//sortを使った方が計算量が少なくなる

// 関数が多くなってきたから、util, srcとかのモジュールに分けたい
//-> jsの場合どうやるのか不明、調べる

//let,varの使い分けがうまくできてない気がする

main();

function main(){
    
    let checkButton = document.getElementById("checkButton");
    
    checkButton.addEventListener('click', start_psm);
    
}


function start_psm(){

    //8~28 : psmデータを読み込む
    let csv = new XMLHttpRequest();
    csv.open("GET", "PSMrawdata.csv", false);

    try {
        csv.send(null);
    } catch(err) {
        console.log(err);
    }

    //data.shape : (37, 5)
    let csvArray = [];
    // 改行ごとに配列化
    let lines = csv.responseText.split(/\r\n|\n/);
    // 1行ごとに処理
    for (let i = 0; i < lines.length; i++) {
        let cells = lines[i].split(",");
        if (cells.length != 1) {
        csvArray.push(cells);
        }
    }
    

    let unit_element = document.getElementById("unit");
    let analysis_unit = Number(unit_element.value);

    let psm_four_point = psm(analysis_unit, csvArray);

    let pme_msg = document.getElementById("pme");
    let opp_msg = document.getElementById("opp");
    let idp_msg = document.getElementById("idp");
    let pmc_msg = document.getElementById("pmc");

    pme_msg.innerHTML = "最高価格 : " + psm_four_point[0][0];
    opp_msg.innerHTML = "理想価格 : " + psm_four_point[1][0];
    idp_msg.innerHTML = "妥協価格 : " + psm_four_point[2][0];
    pmc_msg.innerHTML = "最低品質保証価格 : " + psm_four_point[3][0];

}

function psm(analysis_unit, csvArray){

    console.log(csvArray[1][2]);
    var unit = analysis_unit;
    var psm_analized_data = psmAnalize(csvArray, unit);

    var array_psm_four_point = calFourPSMPoint(psm_analized_data, unit);

    return array_psm_four_point;

    // console.log("point of extensiveness : 最高価格");
    // console.log(array_psm_four_point[0][0]);
    // console.log("Optimum Pricing point : 理想価格");
    // console.log(array_psm_four_point[1][0]);
    // console.log("Indifferrence Price Point : 妥協価格");
    // console.log(array_psm_four_point[2][0]);
    // console.log("Point of Marginal Cheapness : 最低品質保証価格");
    // console.log(array_psm_four_point[3][0]);
}


/* util function psm analysis*/

function psmAnalize(data, unit){
    console.log(data[0].length);
    
    let psm_array = []//shape : (4, max_threshold / unit)

    for(var index=1; index<data[0].length; index++){
        var property_array=[];
        property_array = eachPropertyAnalize(data, index, unit);
        // console.log(property_array.length)
        psm_array[index-1] = property_array
    }

    return psm_array
}


function eachPropertyAnalize(data, property_index, unit){
    var array=[];
    var ret_array=[];
    
    for(var i=1; i < data.length; i++){
        array.push(data[i][property_index]);
        // console.log(data[i][property_index])
    }

    //昇順に並べる
    array.sort((a,b)=> {
        return a > b ? 1: -1;
    })

    if(property_index==1 || property_index==3){
        var isHigh = Boolean("true");
        ret_array = countHelper(array, isHigh, unit);
    }
    else if(property_index==2 || property_index==4){
        var isHigh = Boolean("");
        ret_array = countHelper(array, isHigh, unit);
    }

    console.log(ret_array)
    return ret_array;
}

function countHelper(array, isHigh, unit){
    var count_array = [];
    if(isHigh){
        var threshold = unit;
        var array_index=0;

        while(array_index < array.length){
            if(array[array_index] > threshold){
                //thresholdよ小さい顧客が何人いるかを計算
                count_array.push(array_index);
                threshold += unit;
            }
            else{
                array_index++;
            }
        }
        count_array.push(36);
    }
    else{
        var threshold = unit;
        var array_index=0;
        while(array_index < array.length){
            if(array[array_index] > threshold){
                //thresholdより大きい顧客が何人いるかを計算
                count_array.push(array.length - array_index);
                threshold += unit;
            }
            else array_index++;
        }
        count_array.push(0);
    }

    return count_array;
}



/* util function calulate four point*/

function searchFourPoint(array_ascend, array_descend, unit){
    var index = 0;
    var four_point_array = []
    while(array_ascend[index] <= array_descend[index]){
        index++;
    }

    four_point_array =  [[unit*index, array_ascend[index-1]], [unit*(index+1), array_ascend[index]],
                        [unit*index, array_descend[index-1]], [unit*(index+1), array_descend[index]]];
    
    return four_point_array;
}


function calCrossPoint(point1, point2, point3, point4){
    // point : [x, y]
    var point_array = [];
    var x = (point3[1]-point1[1])*(point1[0]-point2[0])*(point3[0]-point4[0])
    + point1[0]*(point1[1]-point2[1])*(point3[0]-point4[0]) - point3[0]*(point3[1]-point4[1])*(point1[0]-point2[0]);

    x = x/((point1[1]-point2[1])*(point3[0]-point4[0]) - (point1[0]-point2[0])*(point3[1]-point4[1]));

    var y = x*(point1[1]-point2[1])/(point1[0]-point2[0]) + point1[1] - point1[0]*(point1[1]-point2[1])/(point1[0]-point2[0]);

    point_array.push(x);
    point_array.push(y);

    return point_array;
}

function calFourPSMPoint(psm_analized_data, unit){
    //point of extensiveness : 最高価格
    var surround_point_pme = searchFourPoint(psm_analized_data[2], psm_analized_data[1], unit);
    var pme = calCrossPoint(surround_point_pme[0], surround_point_pme[1], surround_point_pme[2], surround_point_pme[3]);

    //Optimum Pricing point : 理想価格
    var surround_point_opp = searchFourPoint(psm_analized_data[2], psm_analized_data[3], unit);
    var opp = calCrossPoint(surround_point_opp[0], surround_point_opp[1], surround_point_opp[2], surround_point_opp[3]);

    //Indifferrence Price Point : 妥協価格
    var surround_point_idp = searchFourPoint(psm_analized_data[0], psm_analized_data[1], unit);
    var idp = calCrossPoint(surround_point_idp[0], surround_point_idp[1], surround_point_idp[2], surround_point_idp[3]);

    //Point of Marginal Cheapness : 最低品質保証価格
    var surround_point_pmc = searchFourPoint(psm_analized_data[0], psm_analized_data[3], unit);
    var pmc= calCrossPoint(surround_point_pmc[0], surround_point_pmc[1], surround_point_pmc[2], surround_point_pmc[3]);

    return [pme, opp, idp, pmc];
}




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

*/