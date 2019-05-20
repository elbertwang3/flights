STATES:= "https://www2.census.gov/geo/tiger/GENZ2017/shp/cb_2017_us_state_20m.zip"
ROADS:= "http://www2.census.gov/geo/tiger/TIGER2016/PRIMARYROADS/tl_2016_us_primaryroads.zip"
URBAN:= "https://www2.census.gov/geo/tiger/GENZ2017/shp/cb_2017_us_ua10_500k.zip"

get:
	wget $(STATES) -P data/states
	unzip -o data/states/cb_2017_us_state_20m.zip -d data/states/
	wget $(ROADS) -P data/roads
	unzip -o data/roads/tl_2016_us_primaryroads.zip -d data/roads/
	wget $(URBAN) -P data/urban
	unzip -o data/urban/cb_2017_us_ua10_500k.zip -d data/urban/



combinelayers: 
	mapshaper -i data/urban/cb_2017_us_ua10_500k.shp data/states/cb_2017_us_state_20m.shp data/roads/tl_2016_us_primaryroads.shp combine-files \
	-rename-layers urban,states,roads \
	-dissolve2 target=urban \
	-dissolve target=roads \
	-simplify .05% target=urban,roads keep-shapes \
	-simplify 1% target=states \
	-o target=states data/map.json format=topojson

all:
	$(MAKE) get
	$(MAKE) combinelayers
