<?php
/**
 * Formulário de busca padrão
 */
if ( ! defined( 'ABSPATH' ) ) exit;
?>
<form role="search" method="get" class="search-bar" action="<?php echo esc_url( home_url( '/' ) ); ?>">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--ink-3);margin-right:4px;">
        <circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/>
    </svg>
    <input type="search" name="s" value="<?php echo esc_attr( get_search_query() ); ?>" placeholder="bar com chope no Centro... café tranquilo...">
    <button class="btn btn-primary" type="submit"><?php esc_html_e( 'Buscar', 'ondesair' ); ?></button>
</form>
