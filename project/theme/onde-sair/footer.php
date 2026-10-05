<?php
/**
 * Rodapé global · Onde Sair
 */
if ( ! defined( 'ABSPATH' ) ) exit;
?>
</main><!-- #main -->

<footer class="footer">
    <div class="shell">
        <div class="row between" style="width:100%;flex-wrap:wrap;gap:24px;">
            <div>
                <span class="footer-logo"><?php echo ondesair_logo(); ?></span>
                <span class="kicker" style="color:rgba(255,255,255,0.7);display:block;margin-top:12px;">Curadoria por afinidade</span>
            </div>
            <div class="footer-links">
                <?php
                wp_nav_menu( [
                    'theme_location' => 'footer',
                    'container'      => false,
                    'items_wrap'     => '%3$s',
                    'fallback_cb'    => function() {
                        echo '<a href="' . esc_url( home_url( '/roteiros' ) ) . '">Roteiros</a>';
                        echo '<a href="' . esc_url( home_url( '/lugares' ) ) . '">Lugares</a>';
                        echo '<a href="' . esc_url( home_url( '/para-dates' ) ) . '">Para dates</a>';
                        echo '<a href="' . esc_url( home_url( '/para-impressionar' ) ) . '">Pra impressionar</a>';
                        echo '<a href="' . esc_url( home_url( '/vip' ) ) . '">VIP</a>';
                        echo '<a href="' . esc_url( home_url( '/parceiros' ) ) . '">Para negócios</a>';
                    },
                ] );
                ?>
            </div>
            <span style="color:rgba(255,255,255,0.55);font-size:13px;font-weight:500;">© <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?></span>
        </div>
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
