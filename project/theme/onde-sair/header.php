<?php
/**
 * Cabeçalho global · Onde Sair
 */
if ( ! defined( 'ABSPATH' ) ) exit;
$os_city = ondesair_current_city();
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="profile" href="https://gmpg.org/xfn/11">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="skip-link screen-reader-text" href="#main"><?php esc_html_e( 'Pular para o conteúdo', 'ondesair' ); ?></a>

<header class="topnav">
    <div class="topnav-inner">
        <a class="brand" href="<?php echo esc_url( home_url( '/' ) ); ?>">
            <span class="brand-logo"><?php echo ondesair_logo(); ?></span>
            <span class="brand-city"><?php echo esc_html( $os_city ); ?></span>
        </a>

        <nav class="navlinks" aria-label="<?php esc_attr_e( 'Navegação principal', 'ondesair' ); ?>">
            <?php
            wp_nav_menu( [
                'theme_location' => 'primary',
                'container'      => false,
                'items_wrap'     => '%3$s',
                'fallback_cb'    => function() {
                    echo '<a class="navlink" href="' . esc_url( home_url( '/' ) ) . '">Descobrir</a>';
                    echo '<a class="navlink" href="' . esc_url( get_post_type_archive_link( 'lugar' ) ) . '">Lugares</a>';
                    echo '<a class="navlink" href="' . esc_url( get_post_type_archive_link( 'roteiro' ) ) . '">Roteiros</a>';
                    echo '<a class="navlink" href="' . esc_url( home_url( '/vip' ) ) . '">VIP</a>';
                },
                'walker' => null,
            ] );
            ?>
        </nav>

        <div class="nav-right">
            <button class="city-pill" type="button" aria-label="Trocar cidade">
                <span class="dot"></span>
                <span><?php echo esc_html( $os_city ); ?></span>
                <span class="caret">▾</span>
            </button>
            <a class="icon-btn" href="<?php echo esc_url( home_url( '/favoritos' ) ); ?>" aria-label="Favoritos">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </a>
        </div>
    </div>
</header>

<main id="main" class="site-main">
