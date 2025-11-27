/* File: js.js
GUI Assignment: Using the jQuery Plugin/UI with Your Dynamic Table
Andrew Belyea, UMass Lowell Computer Science, Andrew_Belyea@student.uml.edu
Copyright (c) 2025 by Andrew. All rights reserved. May be freely copied or
excerpted for educational purposes with credit to the author.
updated by AB on November 26, 2025
Sources: https://www.w3schools.com/
*/


// Keep track of tab id numbers for unique tab panels
var tabIndex = 0;

$(function () {
  // Initialize the main tabs widget
  $("#tabs").tabs();

  // Initialize sliders & bindings
  initSliders();

  // Setup validation
  setupValidation();

  // Event handlers for Generate / Save / Delete selected
  $("#generateBtn").on("click", function () {
    if ($("#mult_form").valid()) {
      buildPreviewTable();
    }
  });

  $("#saveTabBtn").on("click", function () {
    if ($("#mult_form").valid()) {
      saveTab();
    }
  });

  $("#deleteSelectedBtn").on("click", function () {
    deleteSelectedTabs();
  });

  // Also generate initial preview with defaults (0..0)
  setInitialDefaults();
  buildPreviewTable();
});


// Initialization
function setInitialDefaults() {
  // Default values to match a simple table
  if (!$("#row1").val()) $("#row1").val(0);
  if (!$("#row2").val()) $("#row2").val(0);
  if (!$("#col1").val()) $("#col1").val(0);
  if (!$("#col2").val()) $("#col2").val(0);

  // Sync sliders with inputs
  ["row1", "row2", "col1", "col2"].forEach(function(id) {
    var v = Number($("#"+id).val());
    var sliderId = "#slider_" + id;
    try { $(sliderId).slider("value", v); } catch (e) {}
  });
}

// Sliders + Two-way binding
function initSliders() {
  // Common slider options
  var opts = {
    min: -50,
    max: 50,
    slide: function(event, ui) {
      // ui.element isn't standard; find which slider it is by element id
      var id = $(this).attr("id").replace("slider_","");
      $("#" + id).val(ui.value);
      // Update preview live (only if current inputs validate)
      if ($("#mult_form").valid()) {
        buildPreviewTable();
      }
    }
  };

  // Create sliders for each input id
  ["row1","row2","col1","col2"].forEach(function(id) {
    $("#slider_" + id).slider($.extend({}, opts, {
      // Set initial value to 0
      value: Number($("#"+id).val()) || 0
    }));

    // When typing in the input, update slider value (two-way)
    $("#" + id).on("keyup change input", function (e) {
      var val = $(this).val().trim();
      var slider = $("#slider_" + id);
      // Try to set slider only if it's a valid integer within range
      if (/^-?\d+$/.test(val)) {
        var n = Number(val);
        if (n >= -50 && n <= 50) {
          slider.slider("value", n);
        }
      }
      // Trigger validation as user types; and update preview if valid
      if ($("#mult_form").valid()) {
        buildPreviewTable();
      } else {
        // Clear preview if invalid
        $("#preview_table").empty();
      }
    });
  });
}

// Validation setup
function setupValidation() {
  // Custom method to enforce table size <= 100x100 (i.e., <=101 values if inclusive)
  $.validator.addMethod("maxTableSize", function(value, element, params) {
    // Compute the ranges using other inputs
    var r1 = Number($("#row1").val());
    var r2 = Number($("#row2").val());
    var c1 = Number($("#col1").val());
    var c2 = Number($("#col2").val());

    // If any are NaN, this method shouldn't cause immediate failure; other rules handle numeric
    if (isNaN(r1) || isNaN(r2) || isNaN(c1) || isNaN(c2)) return true;

    var rowCount = Math.abs(r2 - r1) + 1;
    var colCount = Math.abs(c2 - c1) + 1;
    // Enforce both dimensions <= 101 (so product <= 10201) but instructor messaging says range cannot exceed 100
    // We'll enforce max 101 values (i.e., difference <=100).
    return (rowCount <= 101 && colCount <= 101);
  }, "Invalid Range. The range for either rows or columns cannot exceed 100 values.");

  // Configure validator
  $("#mult_form").validate({
    // Rules
    rules: {
      row1: {
        required: true,
        number: true,
        min: -50,
        max: 50,
        maxTableSize: true
      },
      row2: {
        required: true,
        number: true,
        min: -50,
        max: 50,
        maxTableSize: true
      },
      col1: {
        required: true,
        number: true,
        min: -50,
        max: 50,
        maxTableSize: true
      },
      col2: {
        required: true,
        number: true,
        min: -50,
        max: 50,
        maxTableSize: true
      }
    },

    // Custom messages
    messages: {
      row1: {
        required: "ERROR: Start multiplier required (between -50 and 50).",
        number: "ERROR: please enter an integer number for the start multiplier (e.g. -3).",
        min: "ERROR: number too small. Minimum is -50.",
        max: "ERROR: number too large. Maximum is 50."
      },
      row2: {
        required: "ERROR: End multiplier required (between -50 and 50).",
        number: "ERROR: please enter an integer number for the end multiplier (e.g. 5).",
        min: "ERROR: number too small. Minimum is -50.",
        max: "ERROR: number too large. Maximum is 50."
      },
      col1: {
        required: "ERROR: Start multiplicand required (between -50 and 50).",
        number: "ERROR: please enter an integer number for the start multiplicand.",
        min: "ERROR: number too small. Minimum is -50.",
        max: "ERROR: number too large. Maximum is 50."
      },
      col2: {
        required: "ERROR: End multiplicand required (between -50 and 50).",
        number: "ERROR: please enter an integer number for the end multiplicand.",
        min: "ERROR: number too small. Minimum is -50.",
        max: "ERROR: number too large. Maximum is 50."
      }
    },

    // Place the error text INSIDE the existing spans for each input
    errorElement: "div",
    errorPlacement: function(error, element) {
      // Map the input id to the appropriate span class
      var id = element.attr("id");
      var spanClass = "." + id + "Text";
      $(spanClass).html(error);
    },

    // When invalid, clear preview (prevents stale table)
    invalidHandler: function(event, validator) {
      $("#preview_table").empty();
      // Remove any swap warnings
      $("#warning_msg").empty();
    },

    // On keyup, validate and update preview if valid
    onkeyup: function(element, event) {
      // Run validation
      this.element(element);
      if ($("#mult_form").valid()) {
        // Clear warning msg then build preview
        $("#warning_msg").empty();
        buildPreviewTable();
      } else {
        $("#preview_table").empty();
      }
    },

    // Do not submit to server; we handle everything client-side
    submitHandler: function(form) {
      // Build preview and do not allow page reload
      buildPreviewTable();
      return false;
    }
  });
}

// Build preview/table
function buildPreviewTable() {
  // Read values; we cast to Number: allow end < start and we will swap with a WARNING, not error
  var r1 = Number($("#row1").val());
  var r2 = Number($("#row2").val());
  var c1 = Number($("#col1").val());
  var c2 = Number($("#col2").val());

  $("#warning_msg").empty();

  // If user entered start > end, swap them but display warning to explain
  if (r1 > r2) {
    $("#warning_msg").text("Note: Horizontal start > end — swapping values for display.");
    var tmp = r1; r1 = r2; r2 = tmp;
  }
  if (c1 > c2) {
    var existing = $("#warning_msg").text();
    if (existing) $("#warning_msg").text(existing + " Also swapped vertical start/end.");
    else $("#warning_msg").text("Note: Vertical start > end — swapping values for display.");
    var tmp2 = c1; c1 = c2; c2 = tmp2;
  }

  // Compute sizes and guard again (defensive)
  var rowCount = Math.abs(r2 - r1) + 1;
  var colCount = Math.abs(c2 - c1) + 1;
  if (rowCount > 101 || colCount > 101) {
    $("#preview_table").html("<div class='warning'>Invalid Range. The range cannot exceed 100 values per dimension.</div>");
    return;
  }

  // Build the HTML table (string assembly)
  var html = "<table class='multiplication_table'>";
  // Header row
  html += "<tr><th></th>";
  for (var h = r1; h <= r2; h++) {
    html += "<th>" + h + "</th>";
  }
  html += "</tr>";

  // rows
  for (var v = c1; v <= c2; v++) {
    html += "<tr>";
    html += "<td>" + v + "</td>";
    for (var h2 = r1; h2 <= r2; h2++) {
      html += "<td>" + (v * h2) + "</td>";
    }
    html += "</tr>";
  }
  html += "</table>";

  $("#preview_table").html(html);
}

// Save table to new tab
function saveTab() {
  // Make sure tabs are initialized
  $("#tabs").tabs();

  // Limit tab count to 24 (example safety)
  var tabCount = $("#tabs ul li").length;
  if (tabCount >= 25) {
    alert("Sorry, only 24 multiplication tables may be saved. Delete one to save another.");
    return;
  }

  // Gather displayed values for labeling (use the text currently in the inputs; label should reflect user's typed values)
  var labelRow1 = $("#row1").val();
  var labelRow2 = $("#row2").val();
  var labelCol1 = $("#col1").val();
  var labelCol2 = $("#col2").val();

  tabIndex++;
  var panelId = "tab-" + tabIndex;

  // Generate a title containing the ranges
  var title = labelRow1 + "–" + labelRow2 + " by " + labelCol1 + "–" + labelCol2;

  // Append tab LI with close icon
  var li = "<li class='tab'><a href='#" + panelId + "'>" + title + "</a> <span class='ui-icon ui-icon-close' role='presentation'></span></li>";
  $("#tabs > ul").append(li);

  // Append the actual content panel: include a checkbox to allow multi-delete
  var content = "<div id='" + panelId + "'>";
  content += "<div class='tab-select'><label><input type='checkbox' class='sel-tab' data-panel='" + panelId + "'/> Select</label></div>";
  // Copy current preview content into the tab (use preview_table HTML)
  var previewHtml = $("#preview_table").html() || "<div class='warning'>No table available to save.</div>";
  content += "<div class='saved_table'>" + previewHtml + "</div>";
  content += "</div>";

  $("#tabs").append(content);

  // Refresh tabs so new tab is recognized by jQuery UI
  $("#tabs").tabs("refresh");

  // Make the new tab active
  var index = $("#tabs ul li").length - 1; // 0-based
  $("#tabs").tabs("option", "active", index);

  // Attach close handler (delegate to support dynamic li)
  $("#tabs").off("click", "span.ui-icon-close").on("click", "span.ui-icon-close", function() {
    var panelID = $(this).closest("li").remove().attr("aria-controls");
    $("#" + panelID ).remove();
    $("#tabs").tabs("refresh");
    // If no saved tabs left, keep only input tab active
    if ($("#tabs ul li").length === 1) {
      $("#tabs").tabs("option", "active", 0);
    }
  });
}

// Delete selected tabs (multi)
function deleteSelectedTabs() {
  // Find all checkboxes inside saved panels that are checked
  var checked = $("#tabs").find("input.sel-tab:checked");
  if (checked.length === 0) {
    alert("No tabs selected for deletion. Use the 'Select' checkbox inside each saved tab.");
    return;
  }

  checked.each(function() {
    var panelId = $(this).attr("data-panel");
    // Remove the li that points to this panel
    $("#tabs").find("li[aria-controls='" + panelId + "']").remove();
    // Remove the panel itself
    $("#" + panelId).remove();
  });

  // Refresh tabs after removals
  $("#tabs").tabs("refresh");

  // Keep input tab active
  $("#tabs").tabs("option", "active", 0);
}

// Utility: clear error spans (not strictly necessary but useful)
function clearInvalidSpans() {
  $(".row1Text, .row2Text, .col1Text, .col2Text").empty();
}