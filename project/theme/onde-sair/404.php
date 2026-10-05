<?php
/**
 * 404
 */
if ( ! defined( 'ABSPATH' ) ) exit;
get_header(); ?>

<div class="shell">
    <section class="section" style="text-align:center;padding:80px 0;">
        <span class="eyebrow">Erro 404</span>
        <h1 class="display" style="font-size:clamp(38px,4.8vw,64px);margin:14px 0 16px;letter-spacing:-0.03em;line-height:1.12;">
            Aqui não tem <span class="accent">rolê</span>.
        </h1>
        <p class="lede" style="max-width:48ch;margin:0 auto 28px;">A página que você procurou não existe — ou já saiu de cena. Que tal recomeçar pela Home?</p>
        <a class="btn btn-cta btn-lg" href="<?php echo esc_url( home_url( '/' ) ); ?>">Voltar pra Home →</a>
    </section>
</div>

<?php get_footer();
