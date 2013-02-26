function RequisitionNonFullSupplyController($scope, FacilityApprovedProducts, $routeParams, $location) {
  FacilityApprovedProducts.get({facilityId:$routeParams.facility, programId:$routeParams.program}, function (data) {
    $scope.nonFullSupplyProducts = data.nonFullSupplyProducts;
  }, function () {
  });

  $scope.pageSize = 5;
  $scope.currentPage = ($routeParams.page) ? parseInt($routeParams.page) : 1;
  groupToPages();

  $scope.$watch("currentPage", function () {
//    $scope.$parent.saveRnr();
    $location.url($location.path() + "?showNonFullSupply=true&page=" + $scope.currentPage);
  });

  function groupToPages() {
    $scope.pagedRnrNonFullSupplyLineItems = [];
    var pageEndIndex;
    var pageStartIndex = 0;
    var sortedRnrLineItems = _.sortBy($scope.$parent.rnr.nonFullSupplyLineItems, function (rnrLineItem) {
      return rnrLineItem.productCode;
    });
    var sortedRnrListLength = sortedRnrLineItems.length;
    var pageNumber;
    for (pageNumber = 1; pageStartIndex < sortedRnrListLength; pageNumber++) {
      if (pageStartIndex + $scope.pageSize > sortedRnrListLength) {
        pageEndIndex = sortedRnrListLength;
      } else {
        pageEndIndex = pageStartIndex + $scope.pageSize;
      }
      $scope.pagedRnrNonFullSupplyLineItems[pageNumber] = sortedRnrLineItems.slice(pageStartIndex, pageEndIndex);
      pageStartIndex = pageStartIndex + $scope.pageSize;
    }
    $scope.noOfPages = ($scope.pagedRnrNonFullSupplyLineItems.length > 0) ? ($scope.pagedRnrNonFullSupplyLineItems.length - 1) : 1;
  }

  $scope.getId = function (prefix, parent, isLossAdjustment) {
    if (isLossAdjustment != null && isLossAdjustment != isUndefined && isLossAdjustment) {
      return prefix + "_" + parent.$parent.$parent.$index + "_" + parent.$parent.$parent.$parent.$index;
    }
    return prefix + "_" + parent.$parent.$parent.$index;
  };

  $scope.addNonFullSupplyLineItem = function () {
    prepareNFSLineItemFields();
    var lineItem = new RnrLineItem($scope.newNonFullSupply, $scope.$parent.rnr, $scope.$parent.programRnrColumnList);

    $scope.$parent.rnr.nonFullSupplyLineItems.push(lineItem);
    lineItem.fillPacksToShipBasedOnCalculatedOrderQuantityOrQuantityRequested();
    $scope.facilityApprovedProduct = undefined;
    $scope.newNonFullSupply = undefined;
    updateNonFullSupplyProductsToDisplay();
    groupToPages();
  };

  $scope.showAddNonFullSupplyModal = function () {
    updateNonFullSupplyProductsToDisplay();
    $scope.nonFullSupplyProductsModal = true;
  };

  $scope.labelForRnrColumn = function (columnName) {
    if ($scope.$parent.programRnrColumnList) return _.findWhere($scope.$parent.programRnrColumnList, {'name':columnName}).label + ":";
  };

  $scope.shouldDisableAddButton = function () {
    return !($scope.newNonFullSupply && $scope.newNonFullSupply.quantityRequested && $scope.newNonFullSupply.reasonForRequestedQuantity
      && $scope.facilityApprovedProduct);
  }

  function populateProductInformation() {
    var product = {};
    angular.copy($scope.facilityApprovedProduct.programProduct.product, product);
    $scope.newNonFullSupply.productCode = product.code;
    $scope.newNonFullSupply.product = (product.primaryName == null ? "" : (product.primaryName + " ")) +
      (product.form.code == null ? "" : (product.form.code + " ")) +
      (product.strength == null ? "" : (product.strength + " ")) +
      (product.dosageUnit.code == null ? "" : product.dosageUnit.code);
    $(['dosesPerDispensingUnit', 'packSize', 'roundToZero', 'packRoundingThreshold', 'dispensingUnit', 'fullSupply']).each(function (index, field) {
      $scope.newNonFullSupply[field] = product[field];
    });
    $scope.newNonFullSupply.maxMonthsOfStock = $scope.facilityApprovedProduct.maxMonthsOfStock;
    $scope.newNonFullSupply.dosesPerMonth = $scope.facilityApprovedProduct.programProduct.dosesPerMonth;
    $scope.newNonFullSupply.price = $scope.facilityApprovedProduct.programProduct.currentPrice;
  }

  function prepareNFSLineItemFields() {
    populateProductInformation();
    $(['quantityReceived', 'quantityDispensed', 'beginningBalance', 'stockInHand', 'totalLossesAndAdjustments', 'calculatedOrderQuantity', 'newPatientCount',
      'stockOutDays', 'normalizedConsumption', 'amc', 'maxStockQuantity']).each(function (index, field) {
        $scope.newNonFullSupply[field] = 0;
      });
    $scope.newNonFullSupply.rnrId = $scope.$parent.rnr.id;
  }

  function updateNonFullSupplyProductsToDisplay() {
    var usedNonFullSupplyProducts = _.pluck($scope.$parent.rnr.nonFullSupplyLineItems, 'productCode');
    $scope.nonFullSupplyProductsToDisplay = $.grep($scope.nonFullSupplyProducts, function (facilityApprovedProduct) {
      return $.inArray(facilityApprovedProduct.programProduct.product.code, usedNonFullSupplyProducts) == -1;
    });
  }
}
