/* global decorist_vars */

jQuery(function ($) {
	'use strict';

	var $window = $(window);
	var $body = $('body');
	var isRTL = $body.hasClass('rtl');

	/* -----------------------------------------
	 Responsive Menu Init
	 ----------------------------------------- */
	var $navWrap          = $( '.nav' );
	var $navSubmenus      = $navWrap.find( 'ul' );
	var $mainNav          = $( '.navigation-main' );
	var $mobileNav        = $( '.navigation-mobile-wrap' );
	var $mobileNavTrigger = $('.mobile-nav-trigger');
	var $mobileNavDismiss = $('.navigation-mobile-dismiss');

	$mainNav.each( function () {
		var $this = $( this );
		$this.clone()
			.find('> li')
			.removeAttr( 'id' )
			.appendTo( $mobileNav.find( '.navigation-mobile' ) );
	} );

	$mobileNav.find( 'li' )
		.each(function () {
			var $this = $(this);
			$this.removeAttr( 'id' );

			if ( $this.find('.sub-menu').length > 0 ) {
				var $button = $( '<button />', {
					class: 'menu-item-sub-menu-toggle',
				} );

				$this.find('> a').after( $button );
			}
		});

	$mobileNav.find('.menu-item-sub-menu-toggle').on( 'click', function ( event ) {
		event.preventDefault();
		var $this = $(this);
		$this.parent().toggleClass('menu-item-expanded')
	} );

	$mobileNavTrigger.on( 'click', function ( event ) {
		event.preventDefault();
		$body.addClass('mobile-nav-open');
		$mobileNavDismiss.focus();
	} );

	$mobileNavDismiss.on( 'click', function ( event ) {
		event.preventDefault();
		$body.removeClass('mobile-nav-open');
		$mobileNavTrigger.focus();
	} );

	/* -----------------------------------------
	Menu classes based on available free space
	----------------------------------------- */
	function setMenuClasses() {
		if ( ! $navWrap.is( ':visible' ) ) {
			return;
		}

		var windowWidth = $window.width();

		$navSubmenus.each( function () {
			var $this   = $( this );
			var $parent = $this.parent();
			$parent.removeClass( 'nav-open-left' );
			var leftOffset = $this.offset().left + $this.outerWidth();

			if ( leftOffset > windowWidth ) {
				$parent.addClass( 'nav-open-left' );
			}
		} );
	}

	setMenuClasses();

	var resizeTimer;

	$window.on( 'resize', function () {
		clearTimeout( resizeTimer );
		resizeTimer = setTimeout( function () {
			setMenuClasses();
		}, 350 );
	} );

	/* -----------------------------------------
	 Sticky Header
	 ----------------------------------------- */
	$('.head-sticky, .header-mobile-sticky').stick_in_parent({
		parent: 'body',
		sticky_class: 'is-stuck'
	});

	/* -----------------------------------------
	Shop filters toggle && Mini Cart visibility
	----------------------------------------- */
	var $filtersWrap    = $('.sidebar-drawer');
	var $filtersToggle  = $('.shop-filter-toggle');
	var $filtersDismiss = $('.sidebar-dismiss');
	var $miniCartTrigger = $('.header-mini-cart-trigger');
	var $miniCart = $('.header-mini-cart-contents');

	function isFiltersVisible() {
		return $filtersWrap.hasClass('sidebar-drawer-visible');
	}

	function dismissFilters(event) {
		if (event) {
			event.preventDefault();
		}
		$filtersWrap.removeClass('sidebar-drawer-visible')
	}

	function displayFilters(event) {
		if (event) {
			event.preventDefault();
		}
		$filtersWrap.addClass('sidebar-drawer-visible');
	}

	$filtersToggle.on('click', displayFilters);
	$filtersDismiss.on('click', dismissFilters);

	function isMiniCartVisible() {
		return $miniCart.is(':visible');
	}

	function dismissMiniCart() {
		$miniCart.addClass('visible');
		$miniCart.fadeOut('fast');
	}

	function displayMiniCart() {
		$miniCart.removeClass('visible');
		$miniCart.fadeIn('fast');
	}

	$miniCartTrigger.on('click', function (event) {
		event.preventDefault();

		if (isMiniCartVisible()) {
			dismissMiniCart();
		} else {
			displayMiniCart();
		}
	});

	/* Event propagations */
	$(document).on('keydown', function (event) {
		if (event.keyCode === 27) {
			dismissFilters(event);
			dismissMiniCart();
		}
	});

	$body
		.on('click', function (event) {
			if (isFiltersVisible()) {
				dismissFilters();
			}

			if (isMiniCartVisible()) {
				dismissMiniCart();
			}

			dismissSearchResults();
		})
		.find('.shop-filter-toggle, ' +
			'.sidebar-drawer, ' +
			'.header-mini-cart-contents, ' +
			'.header-mini-cart-trigger, ' +
			'.category-search-input ',
			'.category-search-select')
		.on('click', function (event) {
			event.stopPropagation();
		});

	/* -----------------------------------------
	 Ajax Search
	 ----------------------------------------- */
	var $productSearchForm = $('.category-search-form');
	var $categoriesSelect = $('.category-search-select');
	var $searchInput = $('.category-search-input');
	var $categoryResults = $('.category-search-results');
	var $categoryResultsTemplate = $('.category-search-results-item');
	var $spinner = $('.category-search-spinner');

	function dismissSearchResults() {
		$categoryResults.hide();
	}

	function queryProducts(category, string) {
		return $.ajax({
			url: decorist_vars.ajaxurl,
			method: 'get',
			data: {
				action: 'decorist_search_products',
				product_cat: category,
				s: string,
			},
		});
	}

	function queryProductsAndPopulateResults(category, string) {
		if (string.trim().length < 3) {
			dismissSearchResults();
			return;
		}

		$spinner.addClass('visible');

		return queryProducts(category, string)
			.done(function (response) {
				$spinner.removeClass('visible');

				if (response.error) {
					var $errorMessage = $categoryResultsTemplate.clone();
					var errorString = response.errors.join(', ');

					$errorMessage.find('.category-search-results-item-thumb').remove();
					$errorMessage.find('.category-search-results-item-excerpt').remove();
					$errorMessage.find('.category-search-results-item-price').remove();

					$errorMessage
						.addClass('error')
						.find('.category-search-results-item-title')
						.text(errorString);
					$categoryResults.html($errorMessage).show();

					return;
				}

				var products = response.data;

				if (products.length === 0) {
					var $notFoundMessage = $categoryResultsTemplate.clone();
					$notFoundMessage.find('.category-search-results-item-thumb').remove();
					$notFoundMessage.find('.category-search-results-item-excerpt').remove();
					$notFoundMessage.find('.category-search-results-item-price').remove();
					$notFoundMessage
						.find('.category-search-results-item-title')
						.text(decorist_vars.search_no_products);
					$categoryResults.html($notFoundMessage).show();

					return;
				}

				var $items = products.map(function (product) {
					var $template = $categoryResultsTemplate.clone();
					$template.find('a').attr('href', product.url);
					if ( ! product.image ) {
						$template.find('.category-search-results-item-thumb').remove();
					} else {
						$template.find('.category-search-results-item-thumb').html(product.image);
					}
					$template.find('.category-search-results-item-title')
						.text(product.title);
					$template.find('.category-search-results-item-excerpt')
						.text(product.excerpt);
					$template.find('.category-search-results-item-price')
						.html(product.price);

					return $template;
				});

				$categoryResults.html($items);
				$categoryResults.show();
			});
	}

	var throttledQuery = throttle(queryProductsAndPopulateResults, 500);

	if ($productSearchForm.hasClass('form-ajax-enabled')) {
		$searchInput.on('change keyup focus', function (event) {
			// Do nothing on arrow up / down as we're using them for navigation
			if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				return;
			}

			var $this = $(this);
			var string = $this.val();

			if (string.trim().length < 3) {
				dismissSearchResults();
				return;
			}

			throttledQuery($categoriesSelect.val(), $this.val());
		});

		// Bind up / down arrow navigation on search results
		$searchInput.on('keydown', function (event) {
			if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
				return;
			}

			var $items = $categoryResults.children();
			var $highlighted = $categoryResults.find('.highlighted');
			var currentIndex = $highlighted.index();

			if ($items.length === 0 || !$items) {
				return;
			}

			if (event.key === 'ArrowDown') {
				var $next = $items.eq(currentIndex + 1);

				if ($next.length) {
					$items.removeClass('highlighted');
					$next.addClass('highlighted');
				}
			}

			if (event.key === 'ArrowUp') {
				var $prev = $items.eq(currentIndex - 1);

				if ($prev.length) {
					$items.removeClass('highlighted');
					$prev.addClass('highlighted');
				}
			}
		});

		// Bind form submit to go the highlighted item on submit
		// instead of normal search
		$productSearchForm.on('submit', function (event) {
			var $highlighted = $categoryResults.find('.highlighted');

			if ($highlighted.length > 0) {
				event.preventDefault();
				window.location = $highlighted.find('a').attr('href');
			}
		});
	}

	/* -----------------------------------------
	Category Slideshow
	----------------------------------------- */

	function getBreakpointsFromClasses(classes) {
		return classes.split(' ').map(function (c) {
			var classData = c.split('-');
			var breakpoint;
			var slideNo;

			if (classData[1] === 'xl') {
				breakpoint = 9999;
				slideNo = 12 / parseInt(classData[2]);
			} else if (classData[1] === 'lg') {
				breakpoint = 1350;
				slideNo = 12 / parseInt(classData[2]);
			} else if (classData[1] === 'md' ) {
				breakpoint = 992;
				slideNo = 12 / parseInt(classData[2]);
			} else if (classData[1] === 'sm') {
				breakpoint = 768;
				slideNo = 12 / parseInt(classData[2]);
			} else if (classData[1] === '12') {
				breakpoint = 576;
				slideNo = 1;
			}

			return {
				breakpoint: breakpoint,
				settings: {
					slidesToShow: slideNo,
					slidesToScroll: slideNo
				}
			}
		});
	}

	function initializeRowSliders($rowSliders) {
		$rowSliders.each(function () {
			var $this = $(this);
			var classes = $this
				.find('div[class^="col"]')
				.first()
				.attr('class');
			var slidesNo = 12 / parseInt(classes.split(' ')[0].split('-')[2]);

			$this.not('.slick-initialized').slick({
				infinite: false,
				slidesToShow: slidesNo,
				slidesToScroll: slidesNo,
				rtl: isRTL,
				appendArrows: $this.parent().parent().find('.row-slider-nav'),
				prevArrow: '<button type="button" class="slick-prev"><i class="fas fa-angle-left"></i></button>',
				nextArrow: '<button type="button" class="slick-next"><i class="fas fa-angle-right"></i></button>',
				responsive: getBreakpointsFromClasses(classes),
			});
		});
	}

	/* -----------------------------------------
	Elementor Init
	----------------------------------------- */
	$(document).on('elementor/render/latest_posts', function(e, data) {
		var $rowSliders = $(this).find('.row-slider');
		initializeRowSliders($rowSliders);
	});

	$(document).on('elementor/render/latest_products', function(e, data) {
		var $rowSliders = $(this).find('.row-slider');
		initializeRowSliders($rowSliders);
	});

	$(document).on('elementor/render/post_type_items', function(e, data) {
		var $rowSliders = $(this).find('.row-slider');
		initializeRowSliders($rowSliders);
	});

	$(document).on('elementor/render/decorist_element', function(e, data) {
		var $rowSliders = $(this).find('.row-slider');
		initializeRowSliders($rowSliders);
	});

	$window.on('load', function () {
		initializeRowSliders($('.row-slider, .wc-slider .row-items'));

		/* -----------------------------------------
		 Hero Slideshow
		 ----------------------------------------- */
		var $heroSlideshow = $('.page-hero-slideshow');
		var navigation = $heroSlideshow.data('navigation');
		var effect = $heroSlideshow.data('effect');
		var speed = $heroSlideshow.data('slide-speed');
		var auto = $heroSlideshow.data('autoslide');

		if ($heroSlideshow.length) {
			$heroSlideshow.slick({
				arrows: navigation === 'arrows' || navigation === 'both',
				dots: navigation === 'dots' || navigation === 'both',
				fade: effect === 'fade',
				autoplaySpeed: speed,
				autoplay: auto === true,
				slide: '.page-hero',
				rtl: isRTL,
				appendArrows: '.page-hero-slideshow-nav',
				prevArrow: '<button type="button" class="slick-prev"><i class="fa fa-angle-left"></i></button>',
				nextArrow: '<button type="button" class="slick-next"><i class="fa fa-angle-right"></i></button>',
				responsive: [
					{
						breakpoint: 992,
						settings: {
							dots: true,
						}
					},
				]
			});
		}
	});

	/**
	 * Returns a function, that, when invoked, will only be triggered at most once
	 * during a given window of time. Normally, the throttled function will run
	 * as much as it can, without ever going more than once per `wait` duration;
	 * but if you'd like to disable the execution on the leading edge, pass
	 * `{leading: false}`. To disable execution on the trailing edge, ditto.
	 *
	 * @param {Function} func - The function to be throttled
	 * @param {Number} wait - Wait time in millis
	 * @param {Object} [options]
	 * @returns {function(): *} - The throttled function
	 */
	function throttle( func, wait, options ) {
		var context, args, result;
		var timeout  = null;
		var previous = 0;

		if ( ! options ) {
			options = {};
		}

		var later = function () {
			previous = options.leading === false ? 0 : Date.now();
			timeout  = null;
			result   = func.apply( context, args );
			if ( ! timeout ) {
				context = args = null;
			}
		};

		return function () {
			var now = Date.now();

			if ( ! previous && options.leading === false ) {
				previous = now;
			}

			var remaining = wait - (now - previous);
			context       = this;
			args          = arguments;

			if ( remaining <= 0 || remaining > wait ) {
				if ( timeout ) {
					clearTimeout( timeout );
					timeout = null;
				}
				previous = now;
				result   = func.apply( context, args );
				if ( ! timeout ) {
					context = args = null;
				}
			} else if ( ! timeout && options.trailing !== false ) {
				timeout = setTimeout( later, remaining );
			}
			return result;
		};
	}
});
