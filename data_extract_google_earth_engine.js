var Rgn = RegionCollection.first();
print(Rgn.geometry());
print(Rgn);
// print(Rgn.get('WARD_NAME'));
var algorithm = function(Rgn){
  var district = ee.Feature(Rgn.geometry(),{
    ward_name:Rgn.get('WARD_NAME')
  });
  return district;
}
var districtcol = RegionCollection.map(algorithm);
var wardList = districtcol.toList(districtcol.size());
print(wardList);


var fin_algo = function(ward){
  var Rgn = ee.Feature(ward);
  var img_collec = ee.ImageCollection("NCEP_RE/surface_temp").filterBounds(Rgn.geometry());
  var list = ee.List.sequence(1,240,3);
  var dates = function(n){
    var d = ee.Date('1999-12-01')
    return d.advance(n,'month');
  }
  var li = list.map(dates);
  print(li);
  function getQuarter(date) {
    var date_class = ee.Date.parse('dd-MM-yyyy', date);
    var year = date_class.get('year');
    var month = date_class.get('month');
    return ee.String(year)
                  .cat("_Q")
                  .cat(ee.Number(month).divide(ee.Number(3)).ceil().toInt())
  
  }
  var computeMean = function(start){
    var st = ee.Date(start);
    var end = st.advance(3,'month');
    var filtered_img = img_collec.filterDate(start,end);
    var medianImage = filtered_img.mean();
    var DictMin = medianImage.reduceRegion({
      reducer: ee.Reducer.min(),
      geometry:Rgn.geometry(),
      scale: 30,
    });
  var DictMax = medianImage.reduceRegion({
      reducer: ee.Reducer.max(),
      geometry:Rgn.geometry(),
      scale: 30,
    });
    var quarter;
  
    return ee.Feature(null,{
          Minimum_Mean_Temperature:DictMin.get('air'),
          Maximum_Mean_Temperature:DictMax.get('air'),
          Quarter:getQuarter(st.format('dd-MM-yyyy')),
          Ward:Rgn.get('ward_name')
        });
  };
  var tem_list = li.map(computeMean);
  var feature_collec = ee.FeatureCollection(tem_list);
  return ee.FeatureCollection(tem_list);
 
}

var li = wardList.map(fin_algo);
var features = ee.FeatureCollection(li);
var feature_collec = features.flatten();
  Export.table.toDrive({
  collection: feature_collec,
  folder: 'Test_Folder',
  description:'Test',
  fileFormat: 'CSV'
})
