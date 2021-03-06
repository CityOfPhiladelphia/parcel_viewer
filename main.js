/*
   _____   __  .__
  /  _  \_/  |_|  | _____    ______
 /  /_\  \   __\  | \__  \  /  ___/
/    |    \  | |  |__/ __ \_\___ \
\____|__  /__| |____(____  /____  >
        \/               \/     \/
*/

// turn off console logging in production
// TODO come up with better way of doing this with webpack + env vars
// console.log = console.info = console.debug = console.error = function () {};

var GATEKEEPER_KEY = '8915b4f6dd7160c4895fc21a1ce736f7';
var BASE_CONFIG_URL = 'https://rawgit.com/ajrothwell/atlas-dor-base-config/1b7222caf8801f078dce957c531fc9bbc8fbe130/config.js';

// var ZONING_CODE_MAP = {
//   'RSD-1': 'Residential Single Family Detached-1',
//   'RSD-2': 'Residential Single Family Detached-2',
//   'RSD-3': 'Residential Single Family Detached-3',
//   'RSA-1': 'Residential Single Family Attached-1',
//   'RSA-2': 'Residential Single Family Attached-2',
//   'RSA-3': 'Residential Single Family Attached-3',
//   'RSA-4': 'Residential Single Family Attached-4',
//   'RSA-5': 'Residential Single Family Attached-5',
//   'RTA-1': 'Residential Two-Family Attached-1',
//   'RM-1': 'Residential Multi-Family-1',
//   'RM-2': 'Residential Multi-Family-2',
//   'RM-3': 'Residential Multi-Family-3',
//   'RM-4': 'Residential Multi-Family-4',
//   'RMX-1': 'Residential Mixed-Use-1',
//   'RMX-2': 'Residential Mixed-Use-2',
//   'RMX-3': 'Residential (Center City) Mixed-Use-3',
//   'CA-1': 'Auto-Oriented Commercial-1',
//   'CA-2': 'Auto-Oriented Commercial-2',
//   'CMX-1': 'Neighborhood Commercial Mixed-Use-1',
//   'CMX-2': 'Neighborhood Commercial Mixed-Use-2',
//   'CMX-2.5': 'Neighborhood Commercial Mixed-Use-2.5',
//   'CMX-3': 'Community Commercial Mixed-Use',
//   'CMX-4': 'Center City Commercial Mixed-Use',
//   'CMX-5': 'Center City Core Commercial Mixed-Use',
//   'I-1': 'Light Industrial',
//   'I-2': 'Medium Industrial',
//   'I-3': 'Heavy Industrial',
//   'IP': 'Port Industrial',
//   'ICMX': 'Industrial Commercial Mixed-Use',
//   'IRMX': 'Industrial Residential Mixed-Use',
//   'SPENT': 'Commercial Entertainment (Casinos)',
//   'SPAIR': 'Airport',
//   'SPINS': 'Institutional Development',
//   'SPSTA': 'Stadium',
//   'SPPOA': 'Recreation',
//   'SPPOP': 'Recreation',
// };

function cleanDorAttribute(attr) {
  // console.log('cleanDorAttribute is running with attr', attr);
  // trim leading and trailing whitespace
  var cleanAttr = attr ? String(attr) : '';
  cleanAttr = cleanAttr.replace(/\s+/g, '');

  // return null for zeros and empty strings
  // if (['', '0'].indexOf(cleanAttr) > -1) {
  //   return null;
  // }

  // return empty for zeros and null
  if ([null, '0'].indexOf(cleanAttr) > -1) {
    return '';
  }

  // console.log('cleanDorAttribute cleanAttr result:', cleanAttr);
  return cleanAttr;
}

// TODO put this in base config transforms
function concatDorAddress(parcel, includeUnit) {
  console.log('concatDorAddress is running with parcel:', parcel, 'includeUnit:', includeUnit);
  includeUnit = typeof includeUnit !== 'undefined' ? includeUnit: true;
  var STREET_FIELDS = ['STDIR', 'STNAM', 'STDES', 'STDESSUF'];
  var props = parcel.properties;

  // handle house num
  var addressLow = cleanDorAttribute(props.HOUSE);
  var addressHigh = cleanDorAttribute(props.STEX);
  // maybe should be props.SUF below (it said props.SUFFIX)
  var addressSuffix = cleanDorAttribute(props.SUF);
  var address = addressLow;
  address = address + (addressHigh ? '-' + addressHigh : '');
  address = address + (addressSuffix || '');

  // handle unit
  var unit = cleanDorAttribute(props.UNIT);
  if (unit) unit = '# ' + unit;

  // clean up attributes
  var comps = STREET_FIELDS.map(function(streetField) {
    return props[streetField];
  });
  comps = comps.map(cleanDorAttribute);
      // TODO handle individual address comps (like mapping stex=2 => 1/2)
      // addressLow = comps.HOUSE,
      // addressHigh = comps.STEX,
      // streetPredir = comps.STDIR,
      // streetName = comps.STNAM,
      // streetSuffix = comps.STDES,
      // streetPostdir = comps.STDESSUF,

  // add address to front
  comps = [address].concat(comps);

  // add unit to end
  if (includeUnit) comps = comps.concat([unit]);

  // remove nulls and concat
  address = comps.filter(Boolean).join(' ');

  // console.log('concatDorAddress address result:', address);
  if (address === '') {
    address = 'Parcel has no address';
  }
  return address;
}

function getVacancyText(state) {
  var land = state.sources.vacantLand.data
  var building = state.sources.vacantBuilding.data
  if (land.length === 0 && building.length === 0) {
    return 'Not Likely Vacant'
  } else if (land.length > 0) {
    return 'Likely Vacant Land'
  } else if (building.length > 0) {
    return 'Likely Vacant Building'
  }
}

// configure accounting.js
accounting.settings.currency.precision = 0;

Mapboard.default({
  // DEV
  // defaultAddress: '1234 MARKET ST',
  router: {
    enabled: true
  },
  geolocation: {
    enabled: false
  },
  rootStyle: {
    position: 'absolute',
    bottom: 0,
    // top: '78px',
    top: '118px',
    left: 0,
    right: 0,
  },
  map: {
    // possibly should move to base config
    defaultBasemap: 'pwd',
    defaultIdentifyFeature: 'address-marker',
    imagery: {
      enabled: true
    },
    historicBasemaps: {
      enabled: true
    },
  },
  baseConfig: BASE_CONFIG_URL,
  parcels: {
    pwd: {
      multipleAllowed: false,
      geocodeFailAttemptParcel: null,
      clearStateOnError: false,
      wipeOutOtherParcelsOnReverseGeocodeOnly: true,
      geocodeField: 'PARCELID',
      parcelIdInGeocoder: 'pwd_parcel_id',
      getByLatLngIfIdFails: false
    },
    dor: {
      multipleAllowed: true,
      geocodeFailAttemptParcel: 'pwd',
      clearStateOnError: true,
      wipeOutOtherParcelsOnReverseGeocodeOnly: false,
      geocodeField: 'MAPREG',
      parcelIdInGeocoder: 'dor_parcel_id',
      getByLatLngIfIdFails: true
    }
  },
  dataSources: {
    // nearby: {
    //   type: 'http-get',
    //   url: 'https://phl.carto.com/api/v2/sql',
    //   options: {
    //     params: {
    //       q: function(feature) {
    //         var aisX = feature.geometry.coordinates[0];
    //         var aisY = feature.geometry.coordinates[1];
    //         var table = 'incidents_part1_part2';
    //         var distanceFn = "ST_Distance(the_geom_webmercator, ST_Transform(CDB_LatLng(" + aisY + ", " + aisX + "), 3857)) * 3.28084";
    //         var where = distanceFn + ' < 500';
    //         //fieldMap = activityType.fieldMap,
    //         var select = ['ST_X(the_geom) as x',
    //                         'ST_Y(the_geom) as y',
    //                         distanceFn + "AS distance",
    //                       ].join(', ');
    //         query = ['SELECT', select, 'FROM', table, 'WHERE', where].join(' ');
    //         return (query);
    //         }
    //     },
    //     success(data) {
    //       return data
    //     }
    //   }
    // },
    // opa: {
    //   type: 'http-get',
    //   url: 'https://data.phila.gov/resource/w7rb-qrn8.json',
    //   options: {
    //     params: {
    //       parcel_number: function(feature) { return feature.properties.opa_account_num; }
    //     },
    //     success: function(data) {
    //       return data[0];
    //     }
    //   }
    // },
    // TODO elections and divisions
    // elections: {
    //   url: 'https://api.phila.gov/elections',
    //   type: 'http-get',
    //   params: {
    //
    //   },
    //   success(data) {
    //     return data;
    //   }
    // }
    // divisions: {
    //   url: 'https://gis.phila.gov/arcgis/rest/services/PhilaGov/ServiceAreas/MapServer/22',
    //   type: 'http-get',
    //   params: {
    //
    //   },
    //   success(data) {
    //     return data;
    //   }
    // },
    stormwater: {
      type: 'http-get',
      url: 'https://api.phila.gov/stormwater',
      options: {
        params: {
          search: function(feature){ return feature.properties.street_address; }
        },
        success: function(data) {
          return data[0];
        }
      }
    },
    liPermits: {
      type: 'http-get',
      url: 'https://phl.carto.com/api/v2/sql',
      options: {
        params: {
          q: function(feature){ return "select * from li_permits where address = '" + feature.properties.street_address + "' or addresskey = '" + feature.properties.li_address_key.toString() + "'"},
        }
      }
    },
    // liPermitsAdditional: {
    //   type: 'http-get',
    //   url: 'http://ase.phila.gov/arcgis/rest/services/GSG/GIS_LNI_LI_PERMITS_PLANNING/FeatureServer/0/query?',
    //   options: {
    //     params: {
    //       where: function(feature) {
    //         return "ADDRESS = '" + feature.properties.street_address + "' OR ADDRESSKEY = '" + feature.properties.li_address_key + "'"
    //       },
    //       outFields: '*',
    //       f: 'json'
    //     },
    //     success: function(data) {
    //       return data.features;
    //     },
    //   },
    // },
    liInspections: {
      type: 'http-get',
      url: 'https://phl.carto.com/api/v2/sql',
      options: {
        params: {
          q: function(feature){ return "select * from li_case_inspections where address = '" + feature.properties.street_address + "' or addresskey = '" + feature.properties.li_address_key.toString() + "'"},
        }
      }
    },
    liViolations: {
      type: 'http-get',
      url: 'https://phl.carto.com/api/v2/sql',
      options: {
        params: {
          q: function(feature){ return "select * from li_violations where address = '" + feature.properties.street_address + "' or addresskey = '" + feature.properties.li_address_key.toString() + "'"},
        }
      }
    },
    liBusinessLicenses: {
      type: 'http-get',
      url: 'https://phl.carto.com/api/v2/sql',
      options: {
        params: {
          q: function(feature){ return "select * from li_business_licenses where street_address = '" + feature.properties.street_address + "'"},// + "' or addresskey = '" + feature.properties.li_address_key.toString() + "'",
        }
      }
    },
    zoningAppeals: {
      type: 'http-get',
      url: 'https://phl.carto.com/api/v2/sql',
      options: {
        params: {
          q: function(feature) {
            var stmt = "select * from li_appeals where address = '" + feature.properties.street_address + "'";
            var addressKey = feature.properties.li_address_key;

            if (addressKey && addressKey.length > 0) {
              stmt += " or addresskey = '" + feature.properties.li_address_key.toString() + "'";
            }

            return stmt;
          }
        }
      }
    },
    zoningDocs: {
      type: 'http-get',
      url: 'https://phl.carto.com/api/v2/sql',
      options: {
        params: {
          q: function(feature) {
            // var stmt = "select * from zoning_documents_20170420 where address_std = '" + feature.properties.street_address + "'";

            var stmt = "select * from ais_zoning_documents where doc_id = ANY('{" + feature.properties.zoning_document_ids + "}'::text[])";

            // var stmt = "select * from ais_zoning_documents where doc_id in '"
            // for (i = 0; i < feature.properties.zoning_document_ids.length; i++) {
            //   stmt += feature.properties.zoning_document_ids[i] + "', '"
            // }
            // stmt += "']";

            // var addressKey = feature.properties.li_address_key;
            // if (addressKey && addressKey.length > 0) {
            //   stmt += " or addrkey = " + feature.properties.li_address_key;
            // }
            return stmt;
          }
        }
      }
    },
    // // TODO take zoningBase out and use AIS for base zoning district
    zoningBase: {
      type: 'esri',
      url: 'https://gis.phila.gov/arcgis/rest/services/PhilaGov/ZoningMap/MapServer/6/',
      options: {
        relationship: 'contains',
      },
      success: function(data) {
        return data;
      }
    },
    rco: {
      type: 'esri',
      url: '//services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Zoning_RCO/FeatureServer/0',
      options: {
        relationship: 'contains',
      },
      // success(data) {
      //   // format phone numbers
      //   console.log('rco success', data);
      //
      //   var s2 = (""+s).replace(/\D/g, '');
      //   var m = s2.match(/^(\d{3})(\d{3})(\d{4})$/);
      //   return (!m) ? null : "(" + m[1] + ") " + m[2] + "-" + m[3];
      //
      //   return data;
      // }
    },
    dorCondoList: {
      type: 'http-get',
      targets: {
        get: function(state) {
          return state.parcels.dor.data;
        },
        getTargetId: function(target) {
          return target.properties.OBJECTID;
        },
      },
      url: 'https://phl.carto.com/api/v2/sql',
      options: {
        params: {
          q: function(feature, state){
            console.log(state.parcels.dor.data[0].properties, 'mapreg', state.parcels.dor.data[0].properties.MAPREG);
            return "select * from condominium where mapref = '" + state.parcels.dor.data[0].properties.MAPREG + "'"
          },// + "' or addresskey = '" + feature.properties.li_address_key.toString() + "'",
        }
      }
    },
    dorDocuments: {
      type: 'http-get',
      targets: {
        get: function(state) {
          return state.parcels.dor.data;
        },
        getTargetId: function(target) {
          return target.properties.OBJECTID;
        },
      },
      // url: '//ase.phila.gov/arcgis/rest/services/RTT/MapServer/0/query',
      // url: '//ase.phila.gov/arcgis/rest/services/DOR/rttsummary/MapServer/0/query',
      url: '//gis.phila.gov/arcgis/rest/services/DOR/rtt_service/MapServer/0/query',
      // url: 'https://phl.carto.com/api/v2/sql',
      options: {
        params: {
          where: function(feature, state) {
            // METHOD 1: via address
            var parcelBaseAddress = concatDorAddress(feature);
            var geocode = state.geocode.data.properties;
            console.log('parcelBaseAddress', parcelBaseAddress)

            // REVIEW if the parcel has no address, we don't want to query
            // WHERE ADDRESS = 'null' (doesn't make sense), so use this for now
            if (!parcelBaseAddress || parcelBaseAddress === 'null'){
              var where = "MATCHED_REGMAP = '" + state.parcels.dor.data[0].properties.BASEREG + "'";
              console.log('DOR Parcel BASEREG', state.parcels.dor.data[0].properties.BASEREG);
            } else {
              const address_low = state.geocode.data.properties.address_low
              roundto100 = function(address) { return Math.floor(address/100, 1)*100}
              const address_floor = roundto100(address_low);
              const address_remainder = address_low - address_floor;
              console.log('address_low:', address_low, 'address_floor:', address_floor);
              var where = "((ADDRESS_LOW = " + address_low
                        + " OR (ADDRESS_LOW >= " + address_floor + " AND ADDRESS_LOW <= " + address_low + " AND ADDRESS_HIGH >= " + address_remainder + " ))"
                        + " AND STREET_NAME = '" + geocode.street_name
                        + "' AND STREET_SUFFIX = '" + geocode.street_suffix
                        + "'"
              if (geocode.street_predir != '') {
                where += " AND STREET_PREDIR = '" + geocode.street_predir + "'";
              }
              if (geocode.address_low_suffix != '') {
                where += " AND ADDRESS_LOW_SUFFIX = '" + geocode.address_low_suffix + "'";
              }
              if (geocode.street_postdir != '') {
                where += " AND STREET_POSTDIR = '" + geocode.street_postdir + "'";
              }
              // check for unit num
              var unitNum = cleanDorAttribute(feature.properties.UNIT);
              console.log('DOR Parcel BASEREG - feature:', feature);
              var unitNum2 = geocode.unit_num;
              if (unitNum) {
                where += " AND UNIT_NUM = '" + unitNum + "'";
              } else if (unitNum2 != '') {
                where += " AND UNIT_NUM = '" + unitNum2 + "'";
              }

              where += ") or MATCHED_REGMAP = '" + state.parcels.dor.data[0].properties.BASEREG + "'";
              // where += ") OR (STREET_ADDRESS='" + parcelBaseAddress + "'";
              // if (unitNum) {
              //   where +="AND UNIT_NUM = '" + unitNum + "'";
              // }
              // where += ")"
            }

            // METHOD 2: via parcel id - the layer doesn't have mapreg yet, though
            // var mapreg = feature.properties.MAPREG;
            // var where = `MAPREG = '${mapreg}'`;

            // console.log('dor docs where', where);

            return where;

          // q: function(feature, state) {
          //   // METHOD 1: via address
          //   var parcelBaseAddress = concatDorAddress(feature);
          //   var geocode = state.geocode.data.properties;
          //   // console.log('parcelBaseAddress', parcelBaseAddress)
          //
          //   // REVIEW if the parcel has no address, we don't want to query
          //   // WHERE ADDRESS = 'null' (doesn't make sense), so use this for now
          //   if (!parcelBaseAddress || parcelBaseAddress === 'null'){
          //     var where = "select * from vw_rtt_summary where matched_regmap = '" + state.parcels.dor.data[0].properties.BASEREG + "'";
          //     // console.log('DOR Parcel BASEREG', state.parcels.dor.data[0].properties.BASEREG);
          //   } else {
          //     var address_low = state.geocode.data.properties.address_low
          //     roundto100 = function(address) { return Math.floor(address/100, 1)*100}
          //     var address_floor = roundto100(address_low);
          //     var address_remainder = address_low - address_floor;
          //     // console.log('address_low:', address_low, 'address_floor:', address_floor, 'address_remainder', address_remainder);//, 'address_high', address_high);
          //       var where = "select * from vw_rtt_summary where ((address_low = " + address_low
          //                 + " or (address_low >= " + address_floor + " and address_low <= " + address_low
          //                 + " and (CASE WHEN address_high ~ '^\d+$' THEN address_high::numeric END) >= " + address_remainder + " ))"
          //                 // + " and (CASE WHEN address_high <> '' and address_high <> 'N' THEN address_high::numeric END) >= " + address_remainder + " ))"
          //                 + " and street_name = '" + geocode.street_name
          //                 + "' and street_suffix = '" + geocode.street_suffix
          //                 + "'"
          //     if (geocode.street_predir != '') {
          //       where += " and street_predir = '" + geocode.street_predir + "'";
          //     }
          //     if (geocode.address_low_suffix != '') {
          //       where += " and address_low_suffix = '" + geocode.address_low_suffix + "'";
          //     }
          //     if (geocode.street_postdir != '') {
          //       where += " and street_postdir = '" + geocode.street_postdir + "'";
          //     }
          //     // check for unit num
          //     var unitNum = cleanDorAttribute(feature.properties.UNIT);
          //     // console.log('DOR Parcel BASEREG - feature:', feature);
          //     var unitNum2 = geocode.unit_num;
          //     if (unitNum) {
          //       where += " and unit_num::int = '" + unitNum + "'";
          //     } else if (unitNum2 != '') {
          //       where += " and unit_num = '" + unitNum2 + "'";
          //     }
          //     where += ") or matched_regmap = '" + state.parcels.dor.data[0].properties.BASEREG + "'";
          //     // console.log('where', where);
          //   }
          //
          //   // METHOD 2: via parcel id - the layer doesn't have mapreg yet, though
          //   // var mapreg = feature.properties.MAPREG;
          //   // var where = `MAPREG = '${mapreg}'`;
          //
          //   // console.log('dor docs where', where);
          //
          //   return where;
          },
          outFields: "R_NUM, DISPLAY_DATE, DOCUMENT_TYPE, GRANTORS, GRANTEES",
          returnDistinctValues: 'true',
          returnGeometry: 'false',
          f: 'json'
        },
        success: function(data) {
          return data.features;
          // return data.rows;
        }
      },
    },
    '311Carto': {
      type: 'http-get-nearby',
      url: 'https://phl.carto.com/api/v2/sql',
      options: {
        table: 'public_cases_fc',
        dateMinNum: 1,
        dateMinType: 'year',
        dateField: 'requested_datetime',
        params: {},
      }
    },
    crimeIncidents: {
      type: 'http-get-nearby',
      url: 'https://phl.carto.com/api/v2/sql',
      options: {
        table: 'incidents_part1_part2',
        dateMinNum: 1,
        dateMinType: 'year',
        dateField: 'dispatch_date',
        params: {},
      }
    },
    nearbyZoningAppeals: {
      type: 'http-get-nearby',
      url: 'https://phl.carto.com/api/v2/sql',
      options: {
        table: 'li_appeals',
        dateMinNum: 1,
        dateMinType: 'year',
        dateField: 'decisiondate',
        params: {}
      }
    },
    // vacantLand: {
    //   type: 'esri',
    //   url: 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Vacant_Indicators_Land/FeatureServer/0',
    //   options: {
    //     relationship: 'contains',
    //   },
    //   // params: {
    //   //   query: feature => L.esri.query({url: 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Vacant_Indicators_Land/FeatureServer/0'}).contains(feature)
    //   // },
    //   success: function(data) {
    //     return data;
    //   }
    // },
    // vacantBuilding: {
    //   type: 'esri',
    //   url: 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Vacant_Indicators_Bldg/FeatureServer/0',
    //   options: {
    //     relationship: 'contains',
    //   },
    //   // params: {
    //   //   query: feature => L.esri.query({url: 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Vacant_Indicators_Bldg/FeatureServer/0'}).contains(feature)
    //   // },
    //   success: function(data) {
    //     return data;
    //   }
    // },
    vacantIndicatorsPoints: {
      type: 'esri-nearby',
      url: 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Vacant_Indicators_Points/FeatureServer/0',
      options: {
        geometryServerUrl: '//gis.phila.gov/arcgis/rest/services/Geometry/GeometryServer/',
        // radius: 500,
        // units: 'feet',
        calculateDistance: true,
      },
    },
    zoningOverlay: {
      type: 'esri',
      url: 'https://gis.phila.gov/arcgis/rest/services/PhilaGov/ZoningMap/MapServer/1/',
      options: {
        relationship: 'contains',
      },
      success: function(data) {
        return data;
      }
    },
    // TODO call this opaCondoList or something to explain how it's different
    // from dorCondoList
    condoList: {
      type: 'http-get',
      url: '//api.phila.gov/ais/v1/search/',
      options: {
        params: {
          urlAddition: function (feature) {
            return feature.properties.street_address;
          },
          gatekeeperKey: GATEKEEPER_KEY,
          include_units: true,
          opa_only: true,
          page: 1,
        },
        success: function(data) {
          return data;
        }
      }
    },
    regmaps: {
      type: 'esri',
      url: '//services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/MASTERMAPINDEX/FeatureServer/0',
      // deps: ['dorParcels'],
      deps: ['parcels.dor'],
      options: {
        relationship: 'intersects',
        targetGeometry: function(state, Leaflet) {
          // get combined extent of dor parcels
          // var parcels = state.dorParcels.data;
          var parcels = state.parcels.dor.data;
          // console.log('parcels', parcels);

          // build up sets of x and y values
          var xVals = [];
          var yVals = [];

          // loop over parcels
          for (var i=0; i < parcels.length; i++) {
            // console.log('parcels[i]', parcels[i])
            var coordSets = parcels[i].geometry.coordinates;
            // loop over coordinate sets
            for (var j=0; j < coordSets.length; j++) {
              // console.log('coordSets[j]', coordSets[j]);
              // loop over coordinates
              for (var k=0; k < coordSets[j].length; k++) {
                // console.log('coordSets[j][k]', coordSets[j][k]);
                var x = coordSets[j][k][0];
                var y = coordSets[j][k][1];

                xVals.push(x);
                yVals.push(y);
              }
            }
          }

          // take max/min
          var xMin = Math.min.apply(null, xVals);
          var xMax = Math.max.apply(null, xVals);
          var yMin = Math.min.apply(null, yVals);
          var yMax = Math.max.apply(null, yVals);

          // console.log('xVals', xVals, 'xMin', xMin, 'xMax', xMax);
          // console.log('yVals', yVals, 'yMin', yMin, 'yMax', yMax);

          // varruct geometry
          var bounds = L.latLngBounds([
            [yMin, xMin],
            [yMax, xMax]
          ]);

          return bounds;
        }
      },
      success: function(data) {
        return data;
      }
    },
  },
  imageOverlayGroups: {
    regmaps: {
      items: function(state) {
        // console.log('main.js imageOverlayGroups', state)
        return state.sources.regmaps.data;
      }
    }
  },
  legendControls: {
    water: {
      options: {
        topics: ['water'],
        showWithBaseMapOnly: false
      },
      data: {
        'Roof': {
          'background-color': '#FEFF7F',
        },
        'Other Impervious Surface': {
          'background-color': '#F2DCFF',
        }
      }
    },
    deeds: {
      options: {
        topics: ['deeds', 'zoning'],
        showWithBaseMapOnly: true
      },
      data: {
        'Easements': {
          'border-color': 'rgb(255, 0, 197)',
          'border-style': 'solid',
          'border-weight': '1px',
          'width': '12px',
          'height': '12px',
          'font-size': '10px',
        },
        'Transparcels': {
          'border-color': 'rgb(0, 168, 132)',
          'border-style': 'solid',
          'border-weight': '1px',
          'width': '12px',
          'height': '12px',
          'font-size': '10px',
        },
        'Rights of Way': {
          'border-color': 'rgb(249, 147, 0)',
          'border-style': 'solid',
          'border-weight': '1px',
          'width': '12px',
          'height': '12px',
          'font-size': '10px',
        }
      }
    }
  },
  cyclomedia: {
    enabled: true
  },
  pictometry: {
    enabled: true
  },
  overlapParcelsEnabled: true,
  // reusable transforms for topic data. see `topics` section for usage.
  transforms: {
    currency: {
      // a list of global objects this transform depends on
      globals: ['accounting'],
      // this is the function that gets called to perform the transform
      transform: function(value, globals) {
        var accounting = globals.accounting;
        return accounting.formatMoney(value);
      }
    },
    date: {
      globals: ['moment'],
      transform: function(value, globals) {
        var moment = globals.moment;
        return moment(value).format('MM/DD/YYYY');
      }
    },
    phoneNumber: {
      transform: function(value) {
        var s2 = (""+value).replace(/\D/g, '');
        var m = s2.match(/^(\d{3})(\d{3})(\d{4})$/);
        return (!m) ? null : "(" + m[1] + ") " + m[2] + "-" + m[3];
      }
    },
    rcoPrimaryContact: {
      transform: function(value) {
        var PHONE_NUMBER_PAT = /\(?(\d{3})\)?( |-)?(\d{3})(-| )?(\d{4})/g;
        var m = PHONE_NUMBER_PAT.exec(value);

        // check for non-match
        if (!m) {
          return value;
        }

        // standardize phone number
        var std = ['(', m[1], ') ', m[3], '-', m[5]].join('');
        var orig = m[0]
        var valueStd = value.replace(orig, std);

        return valueStd;
      }
    },
    booleanToYesNo: {
      transform: function(value) {
        return value ? 'Yes' : 'No';
      }
    },
    integer: {
      transform: function (value) {
        return !isNaN(value) && parseInt(value);
      },
    },
    prettyNumber: {
      transform: function (value) {
        return !isNaN(value) && value.toLocaleString();
      },
    },
    feet: {
      transform: function (value) {
        return value && value + ' ft';
      },
    },
    squareFeet: {
      transform: function (value) {
        return value && value + ' sq ft';
      },
    }
  },
  greeting:{
    initialMessage: '\
      <h2>Atlas DOR is your front door to the City of Philadelphia.</h2>\
      <p>Here are some things you can do with Atlas DOR:</p>\
      <div class="callout">\
        <ul>\
          <li>Research real estate information including document archives</li>\
          <li>Explore historical imagery and maps</li>\
        </ul>\
      </div>\
      <p>To get started, click anywhere on the map, or type an address, intersection, property assessment account number, or Department of Records Map Registry number into the search box.</p>\
    ',
  },
  topics: [
    {
      key: 'deeds',
      icon: 'book',
      label: 'Deeds',
      // TODO uncommenting this causes the no-content view to show up.
      // dataSources: ['dorDocuments'],
      components: [
        {
          type: 'callout',
          slots: {
            text: '\
              Deed information and document transactions for this address.\
              The map faithfully reflects property boundaries as described in \
              recorded deeds including multiple types of easements.\
              The property boundaries displayed on the map are for reference \
              only and should not be used in place of the recorded deeds or \
              land surveys. Source: Department of Records\
            ',
          }
        },
        {
          type: 'collection-summary',
          options: {
            descriptor: 'parcel',
            // this will include zero quantities
            // includeZeroes: true,
            getValue: function(item) {
              return item.properties.STATUS;
            },
            context: {
              singular: function(list){ return 'There is ' + list + ' at this address.'},
              plural: function(list){ return 'There are ' + list + ' at this address.'}
            },
            types: [
              {
                value: 1,
                label: 'active parcel'
              },
              {
                value: 2,
                label: 'inactive parcel'
              },
              {
                value: 3,
                label: 'remainder parcel'
              }
            ]
          },
          slots: {
            items: function(state) {
              // return state.dorParcels.data;
              return state.parcels.dor.data;
            }
          }
        },
        {
          type: 'tab-group',
          options: {
            getKey: function(item) {
              return item.properties.OBJECTID;
            },
            getTitle: function(item) {
              return item.properties.MAPREG;
            },
            getAddress: function(item) {
              var address = concatDorAddress(item);
              return address;
            },
            // components for the content pane. this essentially a topic body.
            components: [
            //   {
            //     type: 'table-group',
            //     options: {
            //       showBoth: {
            //         mainTable: {
            //           dataSource: null,
            //           id:'dorData',
            //         },
            //         dependentTable: {
            //           dataSource: 'condoList',
            //           id: 'condoList_dor',
            //         }
            //       },
            //       components: [

              {
                type: 'vertical-table',
                options: {
                  nullValue: 'None',
                  // id: 'dorData',
                },
                slots: {
                  title: 'Parcel Details',
                  fields: [
                    {
                      label: 'Map Registry #',
                      value: function(state, item) {
                        return item.properties.MAPREG;
                      },
                    },
                    {
                      label: 'Parcel Address',
                      value: function(state, item) {
                        return concatDorAddress(item);
                      },
                    },
                    {
                      label: 'Status',
                      value: function(state, item) {
                        var status = item.properties.STATUS;
                        var desc;
                        switch(status) {
                          case 1:
                            desc = 'Active';
                            break;
                          case 2:
                            desc = 'Inactive';
                            break;
                          case 3:
                            desc = 'Remainder';
                            break;
                          default:
                            break;
                        }
                        return desc;
                      },
                    },
                    {
                      label: 'Origination Date',
                      value: function(state, item) {
                        return item.properties.ORIG_DATE;
                      },
                      transforms: [
                        'date'
                      ]
                    },
                    {
                      label: 'Inactive Date',
                      value: function(state, item) {
                        return item.properties.INACTDATE;
                      },
                      transforms: [
                        'date'
                      ]
                    },
                    {
                      label: 'Has Air Rights',
                      value: function(state, item) {
                        var suffix = item.properties.SUFFIX;
                        return suffix === 'A' ? 'Yes' : 'No';
                      },
                    },
                    {
                      label: 'Is Condo',
                      value: function(state, item) {
                        if (!item.properties.CONDOFLAG) {
                          return 'No';
                        } else {
                          return 'Yes';
                        }
                        // return item.properties.CONDOFLAG ? 'Yes' : 'No';
                      },
                      // fieldFunction: function(state, item) {
                      //   console.log('state', state);
                      // }
                    },
                    {
                      label: 'Perimeter',
                      value: function (state, item) {
                        return (item.properties || {})['SHAPE.LEN'];
                      },
                      transforms: [
                        'integer',
                        'prettyNumber',
                        'feet',
                      ]
                    },
                    {
                      label: 'Area',
                      value: function(state, item) {
                        return (item.properties || {})['SHAPE.AREA'];
                      },
                      transforms: [
                        'integer',
                        'prettyNumber',
                        'squareFeet',
                      ]
                    },
                  ]
                }  // end slots
              },  // end vertical table
              // {
              //   type: 'horizontal-table',
              //   options: {
              //     topicKey: 'dor',
              //     id: 'condoList',
              //     shouldShowButton: true,
              //     useApiCount: true,
              //     // limit: 100,
              //     fields: [
              //       {
              //         label: 'OPA Account',
              //         value: function(state, item) {
              //           var url = window.location.origin + window.location.pathname + '#/' + item.properties.opa_account_num + '/opa'
              //           return "<a href="+url+">"+item.properties.opa_account_num+" <i class='fa fa-external-link'></i></a>";
              //         },
              //       },
              //       {
              //         label: 'Address',
              //         value: function(state, item) {
              //           var url = window.location.origin + window.location.pathname + '#/' + item.properties.opa_account_num + '/opa'
              //           return "<a href="+url+">"+item.properties.street_address+" <i class='fa fa-external-link'></i></a>";
              //         },
              //       },
              //       {
              //         label: 'Owners',
              //         value: function(state, item) {
              //           var owners = item.properties.opa_owners;
              //           var ownersJoined = owners.join(', ');
              //           return ownersJoined;
              //         }
              //       }
              //     ], // end fields
              //     // sort: {
              //     //   // this should return the val to sort on
              //     //   getValue: function(item) {
              //     //     // return item.attributes.RECORDING_DATE;
              //     //     return item.attributes.DOCUMENT_DATE;
              //     //   },
              //     //   // asc or desc
              //     //   order: 'desc'
              //     // }
              //   },
              //   slots: {
              //     title: 'Condominiums',
              //     highestPageRetrieved: function(state) { return state.sources['condoList'].data.page },
              //     pageCount: function(state) { return state.sources['condoList'].data.page_count },
              //     totalSize: function(state) { return state.sources['condoList'].data.total_size },
              //     items: function(state) {
              //       var data = state.sources['condoList'].data.features;
              //       var rows = data.map(function(row){
              //         var itemRow = row;
              //         return itemRow;
              //       });
              //       return rows;
              //     },
              //   } // end slots
              // },

              //     ]
              //   }
              // },
              {
                type: 'horizontal-table',
                options: {
                  topicKey: 'deeds',
                  id: 'dorCondoList',
                  defaultIncrement: 10,
                  showAllRowsOnFirstClick: true,
                  showOnlyIfData: true,
                  fields: [
                    {
                      label: 'Condo Parcel',
                      value: function(state, item) {
                        return item.recmap + '-' + item.condoparcel;
                      },
                    },
                    {
                      label: 'Condo Name',
                      value: function(state, item) {
                        // return item.attributes.RECORDING_DATE;
                        return item.condo_name;
                      },
                    },
                    {
                      label: 'Unit #',
                      value: function(state, item) {
                        return 'Unit #' + item.condounit;
                      },
                    },
                    // {
                    //   label: 'Grantor',
                    //   value: function(state, item) {
                    //     return item.attributes.GRANTORS;
                    //   },
                    // },
                    // {
                    //   label: 'Grantee',
                    //   value: function(state, item) {
                    //     return item.attributes.GRANTEES;
                    //   },
                    // },
                  ], // end fields
                  sort: {
                    // this should return the val to sort on
                    getValue: function(item) {
                      // return item.attributes.RECORDING_DATE;
                      return item.condounit;
                    },
                    // asc or desc
                    order: 'asc'
                  }
                },
                slots: {
                  title: 'Condominiums',
                  items: function (state, item) {
                    var id = item.properties.OBJECTID;

                    if (state.sources.dorCondoList.targets[id]) {
                      if (state.sources.dorCondoList.targets[id].data) {
                        return state.sources.dorCondoList.targets[id].data.rows;
                      }
                    } else {
                      return [];
                    }
                  },
                } // end slots
              }, // end condos table

              {
                type: 'callout',
                slots: {
                  text: 'The list of documents \
                    shown below may not be a complete history of title to this \
                    parcel. The list is based solely on documents recorded from\
                    1974 forward where those documents contained street addresses\
                    in the original recorded document.\
                  '
                },
              },

              {
                type: 'horizontal-table',
                options: {
                  topicKey: 'deeds',
                  id: 'dorDocuments',
                  defaultIncrement: 25,
                  fields: [
                    {
                      label: 'ID',
                      value: function (state, item) {
                        // return "<a target='_blank' href='//pdx-app01/recorder/eagleweb/viewDoc.jsp?node=DOCC"+item.attributes.R_NUM+"'>"+item.attributes.R_NUM+"<i class='fa fa-external-link'></i></a>"
                        // return item.document_id;
                        return item.attributes.R_NUM;
                      },
                    },
                    {
                      label: 'Date',
                      value: function(state, item) {
                        // return item.attributes.RECORDING_DATE;
                        // return item.display_date;
                        return item.attributes.DISPLAY_DATE;
                      },
                      nullValue: 'no date available',
                      transforms: [
                        'date'
                      ]
                    },
                    {
                      label: 'Type',
                      value: function(state, item) {
                        // return item.document_type;
                        return item.attributes.DOCUMENT_TYPE;
                      },
                    },
                    {
                      label: 'Grantor',
                      value: function(state, item) {
                        // return item.grantors;
                        return item.attributes.GRANTORS;
                      },
                    },
                    {
                      label: 'Grantee',
                      value: function(state, item) {
                        // return item.grantees;
                        return item.attributes.GRANTEES;
                      },
                    },
                  ], // end fields
                  sort: {
                    // this should return the val to sort on
                    getValue: function(item) {
                      // return item.attributes.RECORDING_DATE;
                      // console.log('dor docs sort function running, display_date:', Date.parse(item.display_date));
                      return item.attributes.DISPLAY_DATE;
                      // return Date.parse(item.display_date);
                    },
                    // asc or desc
                    order: 'desc'
                  }
                },
                slots: {
                  title: 'Documents',
                  // defaultIncrement: 25,
                  items: function(state, item) {
                    var id = item.properties.OBJECTID;
                    if (state.sources.dorDocuments.targets[id]) {
                      return state.sources.dorDocuments.targets[id].data;
                    } else {
                      return [];
                    }
                  },
                } // end slots

                // slots: {
                //   title: 'Condominiums',
                //   highestPageRetrieved: function(state) { return state.sources['condoList'].data.page },
                //   pageCount: function(state) { return state.sources['condoList'].data.page_count },
                //   totalSize: function(state) { return state.sources['condoList'].data.total_size },
                //   items: function(state) {
                //     var data = state.sources['condoList'].data.features;
                //     var rows = data.map(function(row){
                //       var itemRow = row;
                //       return itemRow;
                //     });
                //     return rows;
                //   },
                // } // end slots

              }, // end docs table
            ] // end parcel tab content comps
          }, // end parcel tab options
          slots: {
            items: function(state) {
              // return state.dorParcels.data;
              return state.parcels.dor.data;
            }
          }
        }, // end dor parcel tab group comp
        {
          type: 'callout',
          slots: {
            text: '\
              Use the buttons below to view images of hard-copy deed maps, some\
              of which have handwritten information that may be useful for\
              historical deed research.\
            ',
          },
        },
        {
          type: 'overlay-toggle-group',
          options: {
            getKey: function(item) {
              return item.properties.RECMAP;
            },
          },
          slots: {
            title: 'Registry Maps',
            items: function(state) {
              return state.sources.regmaps.data;
            }
          }
        },
        // {
        //   type: 'callout',
        //   slots: {
        //     text: 'The property boundaries displayed on the map are for reference only and may not be used in place of recorded deeds or land surveys. Source: Department of Records.'
        //   }
        // }
      ], // end deeds comps
      basemap: 'dor',
      identifyFeature: 'dor-parcel',
      // identifyFeature: 'address-marker',
      // we might not need this anymore, now that we have identifyFeature
      parcels: 'dor',
      // parcels: 'pwd'
      imageOverlayGroup: 'regmaps',
    },
  ], // end topics
});
